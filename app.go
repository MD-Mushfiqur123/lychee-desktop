package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"strings"
	"sync"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// PipelineNode represents a single node in a pipeline
type PipelineNode struct {
	ID          string  `json:"id"`
	Model       string  `json:"model"`
	Prompt      string  `json:"prompt"`
	Temperature float64 `json:"temperature"`
	MaxTokens   int     `json:"maxTokens"`
}

// PipelineConnection represents a connection between two pipeline nodes
type PipelineConnection struct {
	From string `json:"from"`
	To   string `json:"to"`
}

// PipelineExport is the full pipeline export format for sharing
type PipelineExport struct {
	Name        string               `json:"name"`
	Version     string               `json:"version"`
	Nodes       []PipelineNode       `json:"nodes"`
	Connections []PipelineConnection `json:"connections"`
}

// oauthState holds the active OAuth login session state
type oauthState struct {
	listener    net.Listener
	redirectURI string
}

// OAuth provider configurations (use placeholder values — configure later)
var oauthConfigs = map[string]map[string]string{
	"google": {
		"client_id":     "YOUR_GOOGLE_CLIENT_ID",
		"client_secret": "YOUR_GOOGLE_CLIENT_SECRET",
		"auth_url":      "https://accounts.google.com/o/oauth2/v2/auth",
		"token_url":     "https://oauth2.googleapis.com/token",
		"userinfo_url":  "https://www.googleapis.com/oauth2/v2/userinfo",
		"scope":         "email profile",
	},
	"microsoft": {
		"client_id":     "YOUR_MICROSOFT_CLIENT_ID",
		"client_secret": "YOUR_MICROSOFT_CLIENT_SECRET",
		"auth_url":      "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
		"token_url":     "https://login.microsoftonline.com/common/oauth2/v2.0/token",
		"userinfo_url":  "https://graph.microsoft.com/v1.0/me",
		"scope":         "User.Read",
	},
	"github": {
		"client_id":     "YOUR_GITHUB_CLIENT_ID",
		"client_secret": "YOUR_GITHUB_CLIENT_SECRET",
		"auth_url":      "https://github.com/login/oauth/authorize",
		"token_url":     "https://github.com/login/oauth/access_token",
		"userinfo_url":  "https://api.github.com/user",
		"scope":         "user:email",
	},
}

type App struct {
	ctx        context.Context
	cmd        *exec.Cmd
	mu         sync.Mutex
	lycheePath string

	// OAuth state
	oauthMu     sync.Mutex
	oauthStates map[string]*oauthState
}

func NewApp() *App {
	return &App{
		oauthStates: make(map[string]*oauthState),
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) shutdown(ctx context.Context) {
	if a.cmd != nil {
		a.cmd.Process.Kill()
	}
	// Clean up any active OAuth listeners
	a.oauthMu.Lock()
	for _, state := range a.oauthStates {
		if state.listener != nil {
			state.listener.Close()
		}
	}
	a.oauthMu.Unlock()
}

// StartLychee starts the Lychee serve process
func (a *App) StartLychee(lycheePath string) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	if lycheePath == "" {
		lycheePath = "lychee"
	}
	a.lycheePath = lycheePath

	a.cmd = exec.Command(lycheePath, "serve")
	err := a.cmd.Start()
	if err != nil {
		return fmt.Errorf("failed to start lychee: %w", err)
	}
	return nil
}

// StopLychee stops the running lychee process
func (a *App) StopLychee() {
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.cmd != nil {
		a.cmd.Process.Kill()
		a.cmd = nil
	}
}

// IsLycheeRunning checks if lychee process is running
func (a *App) IsLycheeRunning() bool {
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.cmd == nil {
		return false
	}
	return a.cmd.ProcessState == nil
}

// GetLycheePath returns the path to lychee binary
func (a *App) GetLycheePath() string {
	return a.lycheePath
}

// ExportPipeline saves pipeline JSON data to a file chosen by the user.
// Returns the file path on success.
func (a *App) ExportPipeline(data string) string {
	defaultName := fmt.Sprintf("lychee-pipeline-%s.lychee-pipeline",
		time.Now().Format("2006-01-02"))

	filePath, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		DefaultFilename: defaultName,
		Title:           "Export Lychee Pipeline",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Lychee Pipeline (*.lychee-pipeline)",
				Pattern:     "*.lychee-pipeline",
			},
			{
				DisplayName: "JSON Files (*.json)",
				Pattern:     "*.json",
			},
		},
	})
	if err != nil {
		return fmt.Sprintf("error: %v", err)
	}
	if filePath == "" {
		return "" // user cancelled
	}

	err = os.WriteFile(filePath, []byte(data), 0644)
	if err != nil {
		return fmt.Sprintf("error writing file: %v", err)
	}

	return filePath
}

// ImportPipeline opens a file dialog for the user to select a .lychee-pipeline JSON file.
// Returns the file contents as a JSON string.
func (a *App) ImportPipeline() string {
	filePath, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Import Lychee Pipeline",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Lychee Pipeline (*.lychee-pipeline)",
				Pattern:     "*.lychee-pipeline",
			},
			{
				DisplayName: "JSON Files (*.json)",
				Pattern:     "*.json",
			},
			{
				DisplayName: "All Files (*.*)",
				Pattern:     "*.*",
			},
		},
	})
	if err != nil {
		return fmt.Sprintf(`{"error": "%v"}`, err)
	}
	if filePath == "" {
		return "" // user cancelled
	}

	data, err := os.ReadFile(filePath)
	if err != nil {
		return fmt.Sprintf(`{"error": "failed to read file: %v"}`, err)
	}

	// Validate JSON
	var raw json.RawMessage
	if err := json.Unmarshal(data, &raw); err != nil {
		return fmt.Sprintf(`{"error": "invalid JSON in file: %v"}`, err)
	}

	return string(data)
}

// checkLycheeAPI verifies that the Lychee API is reachable on localhost:11434.
func (a *App) checkLycheeAPI() bool {
	client := &http.Client{Timeout: 3 * time.Second}
	resp, err := client.Get("http://localhost:11434/api/tags")
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	return resp.StatusCode == 200
}

// AutoStartLychee checks if Lychee is already running, and if not, tries to find
// and start the lychee binary. Returns a status message describing the result.
func (a *App) AutoStartLychee() string {
	// Check if already running
	if a.checkLycheeAPI() {
		return "Lychee is already running"
	}

	// Try to find lychee binary in common locations
	paths := []string{"lychee", "lychee.exe"}
	if a.lycheePath != "" {
		paths = append([]string{a.lycheePath}, paths...)
	}

	for _, path := range paths {
		cmd := exec.Command(path, "serve")
		err := cmd.Start()
		if err == nil {
			// Wait a moment for the server to start
			time.Sleep(2 * time.Second)

			a.mu.Lock()
			a.cmd = cmd
			a.lycheePath = path
			a.mu.Unlock()

			if a.checkLycheeAPI() {
				return fmt.Sprintf("Lychee started successfully from %s", path)
			}
			return fmt.Sprintf("Lychee process started from %s but API not yet reachable — retrying...", path)
		}
	}

	return "Could not find or start lychee. Please ensure lychee is installed and in your PATH."
}

// GetLycheeStatus checks if the Lychee API is reachable and returns status information.
// Returns: running (bool), version (string), models (int), error (string), managedProcess (bool).
func (a *App) GetLycheeStatus() map[string]interface{} {
	client := &http.Client{Timeout: 3 * time.Second}

	// Check API
	resp, err := client.Get("http://localhost:11434/api/tags")
	if err != nil {
		return map[string]interface{}{
			"running": false,
			"version": "",
			"models":  0,
			"error":   err.Error(),
		}
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return map[string]interface{}{
			"running": false,
			"version": "",
			"models":  0,
			"error":   fmt.Sprintf("HTTP %d", resp.StatusCode),
		}
	}

	// Parse tags response
	var tagsResult struct {
		Models []interface{} `json:"models"`
	}
	json.NewDecoder(resp.Body).Decode(&tagsResult)

	// Try to get version
	version := ""
	verResp, verErr := client.Get("http://localhost:11434/api/version")
	if verErr == nil {
		defer verResp.Body.Close()
		var verData struct {
			Version string `json:"version"`
		}
		json.NewDecoder(verResp.Body).Decode(&verData)
		version = verData.Version
	}

	// Check if we have a managed process
	a.mu.Lock()
	managedRunning := a.cmd != nil && a.cmd.ProcessState == nil
	a.mu.Unlock()

	return map[string]interface{}{
		"running":        true,
		"version":        version,
		"models":         len(tagsResult.Models),
		"error":          "",
		"managedProcess": managedRunning,
	}
}

// Login starts the OAuth login flow for the given provider.
// It starts a local HTTP server on a random port to receive the OAuth callback,
// generates the authorization URL, opens the browser, and returns the auth URL.
func (a *App) Login(provider string) string {
	config, ok := oauthConfigs[provider]
	if !ok {
		return fmt.Sprintf(`{"error": "unknown provider: %s"}`, provider)
	}

	// Start a local HTTP server on a random port
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return fmt.Sprintf(`{"error": "failed to start local server: %v"}`, err)
	}

	port := listener.Addr().(*net.TCPAddr).Port
	redirectURI := fmt.Sprintf("http://localhost:%d/callback", port)

	// Store the active OAuth state
	a.oauthMu.Lock()
	a.oauthStates[provider] = &oauthState{
		listener:    listener,
		redirectURI: redirectURI,
	}
	a.oauthMu.Unlock()

	// Build the OAuth authorization URL
	authURL := fmt.Sprintf("%s?client_id=%s&redirect_uri=%s&response_type=code&scope=%s&state=%s",
		config["auth_url"],
		config["client_id"],
		url.QueryEscape(redirectURI),
		url.QueryEscape(config["scope"]),
		provider,
	)

	// Signal to shut down the server on completion or timeout
	done := make(chan struct{})

	mux := http.NewServeMux()
	mux.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
		codeParam := r.URL.Query().Get("code")
		errParam := r.URL.Query().Get("error")

		if errParam != "" {
			errDesc := r.URL.Query().Get("error_description")
			runtime.EventsEmit(a.ctx, "oauth:error", map[string]interface{}{
				"provider":    provider,
				"error":       errParam,
				"description": errDesc,
			})
			w.Header().Set("Content-Type", "text/html")
			w.Write([]byte(fmt.Sprintf(
				`<html><body><h1>Login failed</h1><p>%s: %s</p><script>setTimeout(function(){window.close()},3000)</script></body></html>`,
				errParam, errDesc)))
			close(done)
			return
		}

		if codeParam == "" {
			http.Error(w, "missing authorization code", http.StatusBadRequest)
			return
		}

		// Exchange code and emit result
		result := a.HandleOAuthCallback(codeParam, provider)
		runtime.EventsEmit(a.ctx, "oauth:complete", result)

		w.Header().Set("Content-Type", "text/html")
		w.Write([]byte(`<html><body><h1>Login successful!</h1><p>You can close this window.</p><script>window.close()</script></body></html>`))
		close(done)
	})

	server := &http.Server{Handler: mux}

	go func() {
		server.Serve(listener)
	}()

	// Auto-shutdown after 5 minutes or when callback completes
	go func() {
		select {
		case <-done:
		case <-time.After(5 * time.Minute):
		}
		server.Close()
		// Clean up state
		a.oauthMu.Lock()
		delete(a.oauthStates, provider)
		a.oauthMu.Unlock()
	}()

	// Open browser to the authorization URL
	runtime.BrowserOpenURL(a.ctx, authURL)

	return authURL
}

// HandleOAuthCallback exchanges the authorization code for an access token
// and fetches user information from the provider's API.
func (a *App) HandleOAuthCallback(code string, provider string) map[string]interface{} {
	config, ok := oauthConfigs[provider]
	if !ok {
		return map[string]interface{}{"error": fmt.Sprintf("unknown provider: %s", provider)}
	}

	// Look up the active OAuth state for the redirect URI
	a.oauthMu.Lock()
	state, hasState := a.oauthStates[provider]
	a.oauthMu.Unlock()

	redirectURI := ""
	if hasState && state != nil {
		redirectURI = state.redirectURI
	}

	// Exchange authorization code for access token
	accessToken, err := exchangeCode(code, config, redirectURI)
	if err != nil {
		return map[string]interface{}{
			"provider": provider,
			"error":    fmt.Sprintf("token exchange failed: %v", err),
		}
	}

	// Fetch user info with the access token
	userData, err := fetchUserInfo(accessToken, config["userinfo_url"], provider)
	if err != nil {
		return map[string]interface{}{
			"provider": provider,
			"error":    fmt.Sprintf("user info fetch failed: %v", err),
		}
	}

	return map[string]interface{}{
		"provider": provider,
		"user":     userData,
	}
}

// GetOAuthConfig returns the OAuth configuration for a provider
// (client_id, scope, auth_url) for display in the frontend.
func (a *App) GetOAuthConfig(provider string) map[string]string {
	config, ok := oauthConfigs[provider]
	if !ok {
		return map[string]string{"error": fmt.Sprintf("unknown provider: %s", provider)}
	}

	return map[string]string{
		"provider":  provider,
		"client_id": config["client_id"],
		"auth_url":  config["auth_url"],
		"scope":     config["scope"],
		"token_url": config["token_url"],
	}
}

// exchangeCode exchanges an OAuth authorization code for an access token.
func exchangeCode(code string, config map[string]string, redirectURI string) (string, error) {
	client := &http.Client{Timeout: 10 * time.Second}

	data := url.Values{
		"client_id":     {config["client_id"]},
		"client_secret": {config["client_secret"]},
		"code":          {code},
		"redirect_uri":  {redirectURI},
		"grant_type":    {"authorization_code"},
	}

	req, err := http.NewRequest("POST", config["token_url"], strings.NewReader(data.Encode()))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	// Try JSON parsing first (Google, Microsoft)
	var tokenResp map[string]interface{}
	if err := json.Unmarshal(body, &tokenResp); err == nil {
		if accessToken, ok := tokenResp["access_token"].(string); ok {
			return accessToken, nil
		}
		if errDesc, ok := tokenResp["error_description"].(string); ok {
			return "", fmt.Errorf("%s", errDesc)
		}
		return "", fmt.Errorf("no access_token in response: %s", string(body))
	}

	// Try URL-encoded parsing (GitHub returns form-encoded)
	values, err := url.ParseQuery(string(body))
	if err == nil {
		if accessToken := values.Get("access_token"); accessToken != "" {
			return accessToken, nil
		}
		if errDesc := values.Get("error_description"); errDesc != "" {
			return "", fmt.Errorf("%s", errDesc)
		}
	}

	return "", fmt.Errorf("failed to parse token response: %s", string(body))
}

// fetchUserInfo fetches authenticated user information from the provider's API.
func fetchUserInfo(accessToken string, userinfoURL string, provider string) (map[string]interface{}, error) {
	client := &http.Client{Timeout: 10 * time.Second}

	req, err := http.NewRequest("GET", userinfoURL, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/json")

	// GitHub requires a User-Agent header per their API policy
	if provider == "github" {
		req.Header.Set("User-Agent", "Lychee-Desktop")
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("userinfo request failed (HTTP %d): %s", resp.StatusCode, string(body))
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse userinfo response: %w", err)
	}

	return result, nil
}
