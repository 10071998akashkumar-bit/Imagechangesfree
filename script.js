document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const editorArea = document.getElementById('editorArea');
    const imagePreview = document.getElementById('imagePreview');
    const originalInfo = document.getElementById('originalInfo');
    const newInfo = document.getElementById('newInfo');
    
    // Controls
    const resizeWidth = document.getElementById('resizeWidth');
    const resizeHeight = document.getElementById('resizeHeight');
    const lockRatioBtn = document.getElementById('lockRatioBtn');
    const exportFormat = document.getElementById('exportFormat');
    const exportQuality = document.getElementById('exportQuality');
    const qualityValue = document.getElementById('qualityValue');
    const qualityGroup = document.getElementById('qualityGroup');
    const segments = document.querySelectorAll('.segment');
    const cancelBtn = document.getElementById('cancelBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    
    // State
    let originalImage = new Image();
    let originalFile = null;
    let isRatioLocked = true;
    let aspectRatio = 1;
    let resizeMode = 'pixels'; // 'pixels' or 'percentage'
    
    // Constants for Presets
    const PRESETS = {
        passport: { width: 413, height: 531, mode: 'pixels' }, // 3.5x4.5 cm at 300 DPI
        signature: { width: 256, height: 64, mode: 'pixels' }
    };

    // Make selectPreset globally available for HTML inline onclick
    window.selectPreset = function(preset) {
        // Update UI active state
        document.querySelectorAll('.tool-card').forEach(card => card.classList.remove('active'));
        event.currentTarget.classList.add('active');

        if (preset === 'custom') return;

        const data = PRESETS[preset];
        if (data && originalFile) {
            // If an image is already loaded, apply the preset dimensions directly
            isRatioLocked = false;
            lockRatioBtn.classList.remove('active');
            
            // Set to pixels mode
            setResizeMode('pixels');
            
            resizeWidth.value = data.width;
            resizeHeight.value = data.height;
            updatePreviewInfo();
        } else if (data) {
            // Set the inputs even if no image is loaded
            isRatioLocked = false;
            lockRatioBtn.classList.remove('active');
            setResizeMode('pixels');
            resizeWidth.value = data.width;
            resizeHeight.value = data.height;
        }
    };

    // Upload Handlers
    uploadArea.addEventListener('click', (e) => {
        if(e.target !== fileInput && !e.target.classList.contains('btn-primary')) {
            fileInput.click();
        }
    });

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }

        originalFile = file;
        const reader = new FileReader();
        
        reader.onload = (e) => {
            originalImage.src = e.target.result;
            originalImage.onload = () => {
                // Initialize Editor
                uploadArea.style.display = 'none';
                editorArea.style.display = 'grid';
                
                imagePreview.src = originalImage.src;
                aspectRatio = originalImage.width / originalImage.height;
                
                // Set initial values
                if (resizeMode === 'pixels') {
                    // Unless a preset forced values before loading
                    if (!document.querySelector('.tool-card:nth-child(1).active') && !document.querySelector('.tool-card:nth-child(2).active')) {
                        resizeWidth.value = originalImage.width;
                        resizeHeight.value = originalImage.height;
                    }
                } else {
                    resizeWidth.value = 100;
                    resizeHeight.value = 100;
                }
                
                exportFormat.value = file.type;
                toggleQualityControl();
                
                updateOriginalInfo();
                updatePreviewInfo();
            };
        };
        reader.readAsDataURL(file);
    }

    // Formatter
    function formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }

    function updateOriginalInfo() {
        originalInfo.innerHTML = `<i class="fa-solid fa-image"></i> Original: ${originalImage.width}x${originalImage.height} | ${formatBytes(originalFile.size)}`;
    }

    function updatePreviewInfo() {
        if (!originalFile) return;
        
        const w = parseInt(resizeWidth.value) || 0;
        const h = parseInt(resizeHeight.value) || 0;
        
        let newW = w;
        let newH = h;
        
        if (resizeMode === 'percentage') {
            newW = Math.round(originalImage.width * (w / 100));
            newH = Math.round(originalImage.height * (h / 100));
        }

        // Estimate new size (very rough estimation based on area and quality)
        const areaRatio = (newW * newH) / (originalImage.width * originalImage.height);
        const qualityFactor = exportFormat.value === 'image/jpeg' || exportFormat.value === 'image/webp' ? (exportQuality.value / 100) : 1;
        const estimatedSize = originalFile.size * areaRatio * qualityFactor * 0.8; // 0.8 is a magic compression constant
        
        newInfo.innerHTML = `<i class="fa-solid fa-compress"></i> New: ${newW}x${newH} | ~${formatBytes(estimatedSize)}`;
    }

    // Controls Logic
    lockRatioBtn.addEventListener('click', () => {
        isRatioLocked = !isRatioLocked;
        lockRatioBtn.classList.toggle('active', isRatioLocked);
        if (isRatioLocked) {
            // Snap to current ratio based on width
            if (resizeMode === 'pixels') {
                resizeHeight.value = Math.round(resizeWidth.value / aspectRatio);
            } else {
                resizeHeight.value = resizeWidth.value;
            }
            updatePreviewInfo();
        }
    });

    resizeWidth.addEventListener('input', () => {
        if (isRatioLocked) {
            if (resizeMode === 'pixels') {
                resizeHeight.value = Math.round(resizeWidth.value / aspectRatio);
            } else {
                resizeHeight.value = resizeWidth.value;
            }
        }
        updatePreviewInfo();
    });

    resizeHeight.addEventListener('input', () => {
        if (isRatioLocked) {
            if (resizeMode === 'pixels') {
                resizeWidth.value = Math.round(resizeHeight.value * aspectRatio);
            } else {
                resizeWidth.value = resizeHeight.value;
            }
        }
        updatePreviewInfo();
    });

    function setResizeMode(mode) {
        resizeMode = mode;
        segments.forEach(seg => {
            if (seg.dataset.by === mode) {
                seg.classList.add('active');
            } else {
                seg.classList.remove('active');
            }
        });

        const units = document.querySelectorAll('.unit');
        
        if (mode === 'percentage') {
            units.forEach(u => u.textContent = '%');
            resizeWidth.value = 100;
            resizeHeight.value = 100;
            if (isRatioLocked) lockRatioBtn.classList.add('active');
        } else {
            units.forEach(u => u.textContent = 'px');
            resizeWidth.value = originalImage ? originalImage.width : 1080;
            resizeHeight.value = originalImage ? originalImage.height : 1080;
        }
        updatePreviewInfo();
    }

    segments.forEach(btn => {
        btn.addEventListener('click', (e) => {
            setResizeMode(e.target.dataset.by);
        });
    });

    function toggleQualityControl() {
        if (exportFormat.value === 'image/jpeg' || exportFormat.value === 'image/webp') {
            qualityGroup.style.display = 'flex';
        } else {
            qualityGroup.style.display = 'none'; // PNG doesn't use this quality slider in canvas standard
        }
        updatePreviewInfo();
    }

    exportFormat.addEventListener('change', toggleQualityControl);
    
    exportQuality.addEventListener('input', (e) => {
        qualityValue.textContent = e.target.value;
        updatePreviewInfo();
    });

    // Cancel / Reset
    cancelBtn.addEventListener('click', () => {
        editorArea.style.display = 'none';
        uploadArea.style.display = 'block';
        fileInput.value = '';
        originalFile = null;
    });

    // Download / Process Logic
    downloadBtn.addEventListener('click', () => {
        if (!originalFile) return;

        // Animate button
        downloadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
        downloadBtn.disabled = true;

        setTimeout(() => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            let targetW = parseInt(resizeWidth.value);
            let targetH = parseInt(resizeHeight.value);

            if (resizeMode === 'percentage') {
                targetW = Math.round(originalImage.width * (targetW / 100));
                targetH = Math.round(originalImage.height * (targetH / 100));
            }

            canvas.width = targetW;
            canvas.height = targetH;

            // Draw image on canvas
            ctx.drawImage(originalImage, 0, 0, targetW, targetH);

            // Get Data URL
            const quality = parseInt(exportQuality.value) / 100;
            const dataUrl = canvas.toDataURL(exportFormat.value, quality);

            // Trigger Download
            const a = document.createElement('a');
            a.href = dataUrl;
            
            const ext = exportFormat.value.split('/')[1];
            const originalName = originalFile.name.split('.')[0];
            a.download = `${originalName}_resized.${ext}`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Reset button
            downloadBtn.innerHTML = '<i class="fa-solid fa-download"></i> Download Image';
            downloadBtn.disabled = false;
        }, 300); // Slight delay for UI feedback
    });
});
