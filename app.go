package main

import (
	"context"
	"fmt"
	"os/exec"
	"sync"
)

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
