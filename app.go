package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
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

type App struct {
	ctx        context.Context
	cmd        *exec.Cmd
	mu         sync.Mutex
	lycheePath string
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) shutdown(ctx context.Context) {
	if a.cmd != nil {
		a.cmd.Process.Kill()
	}
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
