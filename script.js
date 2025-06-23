class AdvancedPaintApp {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridCanvas = document.getElementById('gridCanvas');
        this.gridCtx = this.gridCanvas.getContext('2d');
        
        // Drawing state
        this.isDrawing = false;
        this.currentTool = 'brush';
        this.currentColor = '#000000';
        this.currentSize = 5;
        this.currentOpacity = 1;
        this.brushStyle = 'round';
        this.fillShape = false;
        
        // Drawing data
        this.startX = 0;
        this.startY = 0;
        this.lastX = 0;
        this.lastY = 0;
        
        // History for undo/redo
        this.history = [];
        this.historyStep = -1;
        this.maxHistory = 50;
        
        // Zoom and grid
        this.zoomLevel = 1;
        this.gridVisible = false;
        
        // Text tool
        this.textX = 0;
        this.textY = 0;
        
        this.initializeCanvas();
        this.bindEvents();
        this.saveState();
        this.updateUI();
        
        console.log('🎨 Advanced Paint App initialized successfully!');
        console.log('👨‍🎓 Created by: Gustansyah Dwi Putra Sujanto (123220210) - IF-A');
    }
    
    initializeCanvas() {
        // Set canvas background
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Set drawing properties
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.imageSmoothingEnabled = true;
        
        // Update canvas info
        this.updateCanvasInfo();
    }
    
    bindEvents() {
        // Canvas events
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
        this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
        
        // Touch events
        this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Tool buttons
        document.getElementById('brushTool').addEventListener('click', () => this.setTool('brush'));
        document.getElementById('eraserTool').addEventListener('click', () => this.setTool('eraser'));
        document.getElementById('sprayTool').addEventListener('click', () => this.setTool('spray'));
        document.getElementById('lineTool').addEventListener('click', () => this.setTool('line'));
        document.getElementById('rectangleTool').addEventListener('click', () => this.setTool('rectangle'));
        document.getElementById('circleTool').addEventListener('click', () => this.setTool('circle'));
        document.getElementById('textTool').addEventListener('click', () => this.setTool('text'));
        document.getElementById('eyedropperTool').addEventListener('click', () => this.setTool('eyedropper'));
        
        // Controls
        document.getElementById('colorPicker').addEventListener('change', (e) => {
            this.currentColor = e.target.value;
            this.updateColorSwatches();
        });
        
        document.getElementById('brushSize').addEventListener('input', (e) => {
            this.currentSize = e.target.value;
            document.getElementById('sizeDisplay').textContent = e.target.value;
        });
        
        document.getElementById('opacitySlider').addEventListener('input', (e) => {
            this.currentOpacity = e.target.value;
            document.getElementById('opacityDisplay').textContent = Math.round(e.target.value * 100) + '%';
        });
        
        document.getElementById('brushStyle').addEventListener('change', (e) => {
            this.brushStyle = e.target.value;
        });
        
        document.getElementById('fillShape').addEventListener('change', (e) => {
            this.fillShape = e.target.checked;
        });
        
        // Color swatches
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                this.currentColor = e.target.dataset.color;
                document.getElementById('colorPicker').value = this.currentColor;
                this.updateColorSwatches();
            });
        });
        
        // Action buttons
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.redo());
        document.getElementById('clearCanvas').addEventListener('click', () => this.clearCanvas());
        document.getElementById('saveCanvas').addEventListener('click', () => this.saveCanvas('png'));
        document.getElementById('saveJPG').addEventListener('click', () => this.saveCanvas('jpg'));
        document.getElementById('loadBtn').addEventListener('click', () => document.getElementById('loadImage').click());
        document.getElementById('loadImage').addEventListener('change', this.handleImageLoad.bind(this));
        
        // Grid and zoom
        document.getElementById('gridToggle').addEventListener('click', () => this.toggleGrid());
        document.getElementById('zoomIn').addEventListener('click', () => this.zoom(1.2));
        document.getElementById('zoomOut').addEventListener('click', () => this.zoom(0.8));
        document.getElementById('resetZoom').addEventListener('click', () => this.resetZoom());
        
        // Help modal
        document.getElementById('helpBtn').addEventListener('click', () => this.showHelp());
        document.querySelector('.close').addEventListener('click', () => this.hideHelp());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
        
        // Text input
        document.getElementById('confirmText').addEventListener('click', () => this.confirmText());
        document.getElementById('cancelText').addEventListener('click', () => this.cancelText());
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('helpModal');
            if (e.target === modal) {
                this.hideHelp();
            }
        });
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }
    
    handleMouseMove(e) {
        this.updateMousePosition(e);
        if (this.isDrawing) {
            this.draw(e);
        }
    }
    
    updateMousePosition(e) {
        const pos = this.getMousePos(e);
        document.getElementById('mousePos').textContent = `${Math.round(pos.x)}, ${Math.round(pos.y)}`;
    }
    
    handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(
            e.type === 'touchstart' ? 'mousedown' : 
            e.type === 'touchmove' ? 'mousemove' : 'mouseup',
            {
                clientX: touch.clientX,
                clientY: touch.clientY
            }
        );
        this.canvas.dispatchEvent(mouseEvent);
    }
    
    startDrawing(e) {
        if (this.currentTool === 'text') return;
        
        this.isDrawing = true;
        const pos = this.getMousePos(e);
        this.startX = pos.x;
        this.startY = pos.y;
        this.lastX = pos.x;
        this.lastY = pos.y;
        
        // Set drawing properties
        this.ctx.lineWidth = this.currentSize;
        this.ctx.globalAlpha = this.currentOpacity;
        
        if (this.currentTool === 'brush' || this.currentTool === 'spray') {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.strokeStyle = this.currentColor;
            this.ctx.fillStyle = this.currentColor;
        } else if (this.currentTool === 'eraser') {
            this.ctx.globalCompositeOperation = 'destination-out';
        } else if (this.currentTool === 'eyedropper') {
            this.pickColor(pos.x, pos.y);
            return;
        }
        
        if (this.currentTool === 'brush') {
            this.ctx.beginPath();
            this.ctx.moveTo(this.lastX, this.lastY);
        }
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        const pos = this.getMousePos(e);
        
        switch (this.currentTool) {
            case 'brush':
                this.drawBrush(pos.x, pos.y);
                break;
            case 'eraser':
                this.drawEraser(pos.x, pos.y);
                break;
            case 'spray':
                this.drawSpray(pos.x, pos.y);
                break;
        }
        
        this.lastX = pos.x;
        this.lastY = pos.y;
    }
    
    stopDrawing(e) {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        
        if (this.currentTool === 'line' || this.currentTool === 'rectangle' || this.currentTool === 'circle') {
            const pos = this.getMousePos(e);
            this.drawShape(pos.x, pos.y);
        }
        
        this.saveState();
        this.ctx.beginPath();
    }
    
    drawBrush(x, y) {
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
    }
    
    drawEraser(x, y) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.currentSize / 2, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawSpray(x, y) {
        const density = 20;
        for (let i = 0; i < density; i++) {
            const offsetX = (Math.random() - 0.5) * this.currentSize;
            const offsetY = (Math.random() - 0.5) * this.currentSize;
            this.ctx.beginPath();
            this.ctx.arc(x + offsetX, y + offsetY, 1, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawShape(endX, endY) {
        const width = endX - this.startX;
        const height = endY - this.startY;
        
        this.ctx.beginPath();
        
        switch (this.currentTool) {
            case 'line':
                this.ctx.moveTo(this.startX, this.startY);
                this.ctx.lineTo(endX, endY);
                this.ctx.stroke();
                break;
            case 'rectangle':
                if (this.fillShape) {
                    this.ctx.fillRect(this.startX, this.startY, width, height);
                } else {
                    this.ctx.strokeRect(this.startX, this.startY, width, height);
                }
                break;
            case 'circle':
                const radius = Math.sqrt(width * width + height * height);
                this.ctx.arc(this.startX, this.startY, radius, 0, Math.PI * 2);
                if (this.fillShape) {
                    this.ctx.fill();
                } else {
                    this.ctx.stroke();
                }
                break;
        }
    }
    
    handleCanvasClick(e) {
        if (this.currentTool === 'text') {
            const pos = this.getMousePos(e);
            this.showTextInput(pos.x, pos.y);
        }
    }
    
    showTextInput(x, y) {
        const textInput = document.getElementById('textInput');
        const rect = this.canvas.getBoundingClientRect();
        
        textInput.style.display = 'block';
        textInput.style.left = (rect.left + x) + 'px';
        textInput.style.top = (rect.top + y) + 'px';
        
        document.getElementById('textBox').focus();
        this.textX = x;
        this.textY = y;
    }
    
    confirmText() {
        const text = document.getElementById('textBox').value;
        if (text) {
            this.ctx.font = `${this.currentSize * 2}px Arial`;
            this.ctx.fillStyle = this.currentColor;
            this.ctx.globalAlpha = this.currentOpacity;
            this.ctx.fillText(text, this.textX, this.textY);
            this.saveState();
        }
        this.cancelText();
    }
    
    cancelText() {
        document.getElementById('textInput').style.display = 'none';
        document.getElementById('textBox').value = '';
    }
    
    pickColor(x, y) {
        const imageData = this.ctx.getImageData(x, y, 1, 1);
        const pixel = imageData.data;
        
        // Convert RGB to HEX
        const hex = "#" + ((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1);
        
        this.currentColor = hex;
        document.getElementById('colorPicker').value = hex;
        this.updateColorSwatches();
        this.showMessage(`Color picked: ${hex}`, 'info');
    }
    
    setTool(tool) {
        this.currentTool = tool;
        this.updateUI();
        this.updateCursor();
    }
    
    updateUI() {
        // Reset all tool buttons
        document.querySelectorAll('[id$="Tool"]').forEach(btn => {
            btn.className = 'btn btn-secondary';
        });
        
        // Set active tool
        const activeBtn = document.getElementById(this.currentTool + 'Tool');
        if (activeBtn) {
            activeBtn.className = 'btn btn-primary active';
        }
    }
    
    updateCursor() {
        const cursors = {
            brush: 'crosshair',
            eraser: 'grab',
            spray: 'crosshair',
            line: 'crosshair',
            rectangle: 'crosshair',
            circle: 'crosshair',
            text: 'text',
            eyedropper: 'copy'
        };
        
        this.canvas.style.cursor = cursors[this.currentTool] || 'crosshair';
    }
    
    updateColorSwatches() {
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.classList.remove('active');
            if (swatch.dataset.color === this.currentColor) {
                swatch.classList.add('active');
            }
        });
    }
    
    updateCanvasInfo() {
        document.getElementById('canvasSize').textContent = `${this.canvas.width} x ${this.canvas.height}`;
        document.getElementById('zoomLevel').textContent = Math.round(this.zoomLevel * 100) + '%';
    }
    
    // History Management
    saveState() {
        this.historyStep++;
        if (this.historyStep < this.history.length) {
            this.history.length = this.historyStep;
        }
        this.history.push(this.canvas.toDataURL());
        
        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
            this.historyStep--;
        }
    }
    
    undo() {
        if (this.historyStep > 0) {
            this.historyStep--;
            this.restoreState();
            this.showMessage('Undo', 'info');
        }
    }
    
    redo() {
        if (this.historyStep < this.history.length - 1) {
            this.historyStep++;
            this.restoreState();
            this.showMessage('Redo', 'info');
        }
    }
    
    restoreState() {
        const img = new Image();
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
        };
        img.src = this.history[this.historyStep];
    }
    
    // Canvas Actions
    clearCanvas() {
        if (confirm('Yakin ingin menghapus semua gambar?')) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.initializeCanvas();
            this.saveState();
            this.showMessage('Canvas cleared', 'success');
        }
    }
    
    // Method untuk menambahkan watermark
    addWatermark() {
        const ctx = this.ctx;
        ctx.save();
        
        // Set watermark style
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        
        // Add watermark text
        const watermarkText = 'Gustansyah Dwi Putra Sujanto - 123220210';
        ctx.fillText(watermarkText, this.canvas.width - 10, this.canvas.height - 10);
        
        ctx.restore();
    }
    
    // Enhanced saveCanvas method dengan watermark
    saveCanvas(format = 'png') {
        // Simpan state canvas saat ini
        const currentState = this.canvas.toDataURL();
        
        // Tambahkan watermark
        this.addWatermark();
        
        // Save dengan watermark
        const link = document.createElement('a');
        const timestamp = new Date().getTime();
        link.download = `painting-gustansyah-${timestamp}.${format}`;
        
        if (format === 'jpg') {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = this.canvas.width;
            tempCanvas.height = this.canvas.height;
            
            tempCtx.fillStyle = 'white';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            tempCtx.drawImage(this.canvas, 0, 0);
            
            link.href = tempCanvas.toDataURL('image/jpeg', 0.9);
        } else {
            link.href = this.canvas.toDataURL('image/png');
        }
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Restore canvas tanpa watermark
        const img = new Image();
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
        };
        img.src = currentState;
        
        this.showMessage(`Image saved as ${format.toUpperCase()} with watermark`, 'success');
    }
    
    handleImageLoad(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
                this.saveState();
                this.showMessage('Image loaded', 'success');
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    // Grid and Zoom
    toggleGrid() {
        this.gridVisible = !this.gridVisible;
        if (this.gridVisible) {
            this.drawGrid();
            document.getElementById('gridToggle').classList.add('active');
        } else {
            this.gridCtx.clearRect(0, 0, this.gridCanvas.width, this.gridCanvas.height);
            document.getElementById('gridToggle').classList.remove('active');
        }
    }
    
    drawGrid() {
        const gridSize = 20;
        this.gridCtx.strokeStyle = '#ddd';
        this.gridCtx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x <= this.gridCanvas.width; x += gridSize) {
            this.gridCtx.beginPath();
            this.gridCtx.moveTo(x, 0);
            this.gridCtx.lineTo(x, this.gridCanvas.height);
            this.gridCtx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.gridCanvas.height; y += gridSize) {
            this.gridCtx.beginPath();
            this.gridCtx.moveTo(0, y);
            this.gridCtx.lineTo(this.gridCanvas.width, y);
            this.gridCtx.stroke();
        }
    }
    
    zoom(factor) {
        this.zoomLevel *= factor;
        this.zoomLevel = Math.max(0.1, Math.min(5, this.zoomLevel)); // Limit zoom
        
        this.canvas.style.transform = `scale(${this.zoomLevel})`;
        this.gridCanvas.style.transform = `scale(${this.zoomLevel})`;
        
        this.updateCanvasInfo();
    }
    
    resetZoom() {
        this.zoomLevel = 1;
        this.canvas.style.transform = 'scale(1)';
        this.gridCanvas.style.transform = 'scale(1)';
        this.updateCanvasInfo();
    }
    
    // Keyboard Shortcuts
    handleKeyboard(e) {
        if (e.target.tagName === 'INPUT') return; // Don't trigger when typing
        
        const key = e.key.toLowerCase();
        
        if (e.ctrlKey || e.metaKey) {
            switch (key) {
                case 's':
                    e.preventDefault();
                    this.saveCanvas();
                    break;
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                    break;
                case 'y':
                    e.preventDefault();
                    this.redo();
                    break;
            }
        } else {
            switch (key) {
                case 'b': this.setTool('brush'); break;
                case 'e': this.setTool('eraser'); break;
                case 's': this.setTool('spray'); break;
                case 'l': this.setTool('line'); break;
                case 'r': this.setTool('rectangle'); break;
                case 'c': this.setTool('circle'); break;
                case 't': this.setTool('text'); break;
                case 'i': this.setTool('eyedropper'); break;
                case 'g': this.toggleGrid(); break;
                case 'h': this.showHelp(); break;
                case '+': case '=': this.zoom(1.2); break;
                case '-': this.zoom(0.8); break;
                case '0': this.resetZoom(); break;
                case 'escape': this.cancelText(); break;
            }
        }
    }
    
    // Help Modal
    showHelp() {
        document.getElementById('helpModal').style.display = 'block';
    }
    
    hideHelp() {
        document.getElementById('helpModal').style.display = 'none';
    }
    
    // Utility
    showMessage(text, type = 'info') {
        const message = document.createElement('div');
        message.textContent = text;
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            font-weight: 500;
            font-size: 14px;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.style.opacity = '0';
            message.style.transform = 'translateX(100%)';
            message.style.transition = 'all 0.3s ease';
            setTimeout(() => message.remove(), 300);
        }, 2500);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.paintApp = new AdvancedPaintApp();
    
    // Add welcome message
    setTimeout(() => {
        window.paintApp.showMessage('Welcome Gustansyah! Paint App Ready 🎨', 'success');
    }, 1000);
    
    console.log('🎨 Advanced Paint App loaded successfully!');
    console.log('👨‍🎓 Created by: Gustansyah Dwi Putra Sujanto (123220210) - IF-A');
});

// Prevent accidental page refresh
window.addEventListener('beforeunload', (e) => {
    e.preventDefault();
    e.returnValue = '';
});