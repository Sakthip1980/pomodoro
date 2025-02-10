class PomodoroTimer {
    constructor() {
        this.DEFAULT_WORK_TIME = 25 * 60; // 25 minutes in seconds
        this.DEFAULT_REST_TIME = 5 * 60;  // 5 minutes in seconds
        this.workTime = this.DEFAULT_WORK_TIME;
        this.breakTime = this.DEFAULT_REST_TIME;
        this.timeLeft = this.workTime;
        this.isRunning = false;
        this.isWorkMode = true;
        this.timer = null;

        // DOM elements
        this.timeDisplay = document.getElementById('time');
        this.startButton = document.getElementById('start');
        this.resetButton = document.getElementById('reset');
        this.statusText = document.getElementById('status');
        this.focusInput = document.getElementById('focus-task');
        this.modeToggleButton = document.getElementById('mode-toggle');

        // Add new DOM elements
        this.workDurationInput = document.getElementById('work-duration');
        this.restDurationInput = document.getElementById('rest-duration');

        // Add notification button element
        this.notificationButton = document.getElementById('notification-toggle');

        // Event listeners
        this.startButton.addEventListener('click', () => this.toggleStartPause());
        this.resetButton.addEventListener('click', () => this.reset());
        this.modeToggleButton.addEventListener('click', () => this.toggleMode());

        // Add event listener for the focus input
        this.focusInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.focusInput.blur();
                this.statusText.textContent = this.focusInput.value;
            }
        });

        // Add event listeners for duration inputs
        this.workDurationInput.addEventListener('change', () => this.updateDurations());
        this.restDurationInput.addEventListener('change', () => this.updateDurations());

        // Add event listener for notification toggle
        this.notificationButton.addEventListener('click', () => this.toggleNotifications());

        // Initialize display
        this.updateModeButton();
        this.updateDisplay();

        // Initialize status with focus input value or default text
        this.statusText.textContent = this.focusInput.value || 'Work Time';

        // Update notification button state
        this.updateNotificationButtonState();
    }

    updateNotificationButtonState() {
        if (!("Notification" in window)) {
            this.notificationButton.textContent = "Notifications Not Supported";
            this.notificationButton.disabled = true;
            return;
        }

        switch (Notification.permission) {
            case "granted":
                this.notificationButton.textContent = "Notifications Enabled";
                this.notificationButton.style.backgroundColor = "#4CAF50";
                break;
            case "denied":
                this.notificationButton.textContent = "Notifications Blocked";
                this.notificationButton.style.backgroundColor = "#f44336";
                break;
            default:
                this.notificationButton.textContent = "Enable Notifications";
                this.notificationButton.style.backgroundColor = "#757575";
        }
    }

    async toggleNotifications() {
        if (!("Notification" in window)) {
            alert("This browser does not support notifications");
            return;
        }

        try {
            if (Notification.permission === "denied") {
                alert("Please enable notifications in your browser settings");
                // Optionally open browser settings if supported
                if (typeof chrome !== "undefined" && chrome.notifications && chrome.notifications.getPermissionLevel) {
                    chrome.notifications.getPermissionLevel(() => {
                        chrome.tabs.create({
                            url: 'chrome://settings/content/notifications'
                        });
                    });
                }
            } else if (Notification.permission === "granted") {
                alert("Notifications are already enabled");
            } else {
                const permission = await Notification.requestPermission();
                if (permission === "granted") {
                    // Show a test notification
                    new Notification("Notifications Enabled", {
                        body: "You will now receive notifications when your timer ends",
                        icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIj48L2NpcmNsZT48cG9seWxpbmUgcG9pbnRzPSIxMiA2IDEyIDEyIDE2IDE0Ij48L3BvbHlsaW5lPjwvc3ZnPg=="
                    });
                }
            }
        } catch (error) {
            console.log("Error requesting notification permission:", error);
        }

        this.updateNotificationButtonState();
    }

    async requestNotificationPermission() {
        // Only update the button state, don't request permission
        this.updateNotificationButtonState();
    }

    showNotification() {
        if (Notification.permission === "granted") {
            // Now we check the current mode before it changes
            const message = this.isWorkMode ? 
                "Time to take a break!" : 
                "Time to get back to work!";
            
            try {
                // Create notification with more options for better Chrome support
                const notification = new Notification("Pomodoro Timer", {
                    body: message,
                    icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIj48L2NpcmNsZT48cG9seWxpbmUgcG9pbnRzPSIxMiA2IDEyIDEyIDE2IDE0Ij48L3BvbHlsaW5lPjwvc3ZnPg==",
                    requireInteraction: false,  // Auto-close after a while
                    silent: false,  // Allow sound
                    tag: 'pomodoro-notification',  // Unique tag for this notification
                    renotify: true,  // Show each notification even if there's already one
                    vibrate: [200, 100, 200]  // Vibration pattern for mobile devices
                });

                // Ensure notification stays visible for a few seconds
                setTimeout(() => notification.close(), 5000);

                // Add click handler
                notification.onclick = function() {
                    window.focus();
                    notification.close();
                };
            } catch (error) {
                console.error("Error showing notification:", error);
            }
        }
    }

    toggleStartPause() {
        if (!this.isRunning) {
            this.start();
            this.startButton.textContent = 'Pause';
            this.startButton.style.backgroundColor = '#FFC107';
            this.startButton.style.hover = '#FFA000';
        } else {
            this.pause();
            this.startButton.textContent = 'Start';
            this.startButton.style.backgroundColor = '#4CAF50';
        }
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.timer = setInterval(() => this.tick(), 1000);
        }
    }

    pause() {
        this.isRunning = false;
        clearInterval(this.timer);
    }

    reset() {
        this.pause();
        this.timeLeft = this.isWorkMode ? this.workTime : this.breakTime;
        this.updateDisplay();
        this.statusText.textContent = this.isWorkMode ? (this.focusInput.value || 'Work Time') : 'Rest Time';
        this.startButton.textContent = 'Start';
        this.startButton.style.backgroundColor = '#4CAF50';
    }

    tick() {
        this.timeLeft--;
        
        if (this.timeLeft <= 0) {
            this.switchMode();
        }
        
        this.updateDisplay();
    }

    toggleMode() {
        this.pause();
        this.isWorkMode = !this.isWorkMode;
        
        this.timeLeft = this.isWorkMode ? this.workTime : this.breakTime;
        
        this.statusText.textContent = this.isWorkMode ? (this.focusInput.value || 'Work Time') : 'Rest Time';
        this.updateModeButton();
        this.updateDisplay();
    }

    updateModeButton() {
        this.modeToggleButton.textContent = this.isWorkMode ? 'Rest Mode' : 'Work Mode';
    }

    switchMode() {
        // Show notification before changing mode
        this.showNotification();
        
        this.isWorkMode = !this.isWorkMode;
        this.timeLeft = this.isWorkMode ? this.workTime : this.breakTime;
        
        if (this.isWorkMode) {
            this.statusText.textContent = this.focusInput.value || 'Work Time';
        } else {
            this.statusText.textContent = 'Rest Time';
        }
        
        this.updateModeButton();
        
        // Play notification sound
        new Audio('data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=').play();
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update timer display
        this.timeDisplay.textContent = timeString;
        
        // Update page title with timer
        document.title = `(${timeString}) Pomodoro Timer`;
    }

    updateDurations() {
        // Get values from inputs (convert to seconds)
        const newWorkTime = Math.max(1, Math.min(60, parseInt(this.workDurationInput.value) || 25)) * 60;
        const newRestTime = Math.max(1, Math.min(60, parseInt(this.restDurationInput.value) || 5)) * 60;

        // Update the times
        this.workTime = newWorkTime;
        this.breakTime = newRestTime;

        // If timer isn't running, update current timeLeft based on mode
        if (!this.isRunning) {
            this.timeLeft = this.isWorkMode ? this.workTime : this.breakTime;
            this.updateDisplay();
        }
    }
}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const pomodoro = new PomodoroTimer();
}); 