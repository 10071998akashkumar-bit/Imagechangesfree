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
    const maintainAspect = document.getElementById('maintainAspect');
    const unitRadios = document.querySelectorAll('input[name="unit"]');
    const formatRadios = document.querySelectorAll('input[name="format"]');
    
    const compressAlso = document.getElementById('compressAlso');
    const compressOptions = document.getElementById('compressOptions');
    const targetSizeKb = document.getElementById('targetSizeKb');
    
    const cancelBtn = document.getElementById('cancelBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    
    // State
    let originalImage = new Image();
    let originalFile = null;
    let aspectRatio = 1;
    let currentUnit = 'pixels'; 
    const DPI = 300; 
    const PX_PER_INCH = DPI;
    const PX_PER_CM = DPI / 2.54;

    let pendingPreset = null;

    window.activateNav = function(element) {
        document.querySelectorAll('.desktop-nav a').forEach(a => a.classList.remove('active'));
        if (element) element.classList.add('active');
    };

    window.selectExamPreset = function(type) {
        if (!originalFile) {
            pendingPreset = type;
            document.getElementById('fileInput').click();
            return;
        }
        
        maintainAspect.checked = false; // Disable to allow strict sizing
        compressAlso.checked = true;
        compressOptions.style.display = 'flex';
        
        document.querySelector('input[name="format"][value="image/jpeg"]').checked = true;
        
        if (type === 'ssc-photo') {
            document.querySelector('input[name="unit"][value="cm"]').click();
            resizeWidth.value = '3.5';
            resizeHeight.value = '4.5';
            targetSizeKb.value = '45'; // Strict SSC max 50KB
        } else if (type === 'ssc-signature') {
            document.querySelector('input[name="unit"][value="cm"]').click();
            resizeWidth.value = '4.0';
            resizeHeight.value = '2.0';
            targetSizeKb.value = '18'; // Strict SSC max 20KB
        } else if (type === 'railway-photo') {
            document.querySelector('input[name="unit"][value="pixels"]').click();
            resizeWidth.value = '240';
            resizeHeight.value = '320';
            targetSizeKb.value = '45'; // Strict RRB max 50KB
        } else if (type === 'railway-signature') {
            document.querySelector('input[name="unit"][value="pixels"]').click();
            resizeWidth.value = '140';
            resizeHeight.value = '60';
            targetSizeKb.value = '35'; // Strict RRB max 40KB
        } else if (type === 'banking-photo') {
            document.querySelector('input[name="unit"][value="pixels"]').click();
            resizeWidth.value = '200';
            resizeHeight.value = '230';
            targetSizeKb.value = '45'; // Safe under 50KB
        } else if (type === 'banking-signature') {
            document.querySelector('input[name="unit"][value="pixels"]').click();
            resizeWidth.value = '140';
            resizeHeight.value = '60';
            targetSizeKb.value = '18'; // Safe under 20KB
        } else if (type === 'banking-thumb') {
            document.querySelector('input[name="unit"][value="pixels"]').click();
            resizeWidth.value = '240';
            resizeHeight.value = '240';
            targetSizeKb.value = '45'; // Safe under 50KB
        } else if (type === 'banking-declaration') {
            document.querySelector('input[name="unit"][value="pixels"]').click();
            resizeWidth.value = '800';
            resizeHeight.value = '400';
            targetSizeKb.value = '90'; // Safe under 100KB
        } else if (type === 'state-photo') {
            document.querySelector('input[name="unit"][value="cm"]').click();
            resizeWidth.value = '3.5';
            resizeHeight.value = '4.5';
            targetSizeKb.value = '80'; // Target 50-100KB
        } else if (type === 'state-signature') {
            document.querySelector('input[name="unit"][value="cm"]').click();
            resizeWidth.value = '3.5';
            resizeHeight.value = '1.5';
            targetSizeKb.value = '40'; // Target 20-50KB
        }
        
        // Trigger manual update
        targetSizeKb.dispatchEvent(new Event('input'));
        updatePreviewInfo();
        
        // Scroll to editor
        editorArea.scrollIntoView({ behavior: 'smooth' });
    };
    
    // Upload Handlers
    uploadArea.addEventListener('click', (e) => {
        if(e.target !== fileInput && !e.target.classList.contains('btn-primary')) {
            fileInput.click();
        }
    });

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleFile(e.target.files[0]);
    });

    function handleFile(file) {
        if (!file.type.startsWith('image/')) return alert('Please select a valid image file.');

        originalFile = file;
        const reader = new FileReader();
        
        reader.onload = (e) => {
            originalImage.src = e.target.result;
            originalImage.onload = () => {
                uploadArea.style.display = 'none';
                editorArea.style.display = 'flex';
                imagePreview.src = originalImage.src;
                aspectRatio = originalImage.width / originalImage.height;
                
                // Initialize default format
                let formatToSelect = 'image/jpeg';
                if(file.type === 'image/png') formatToSelect = 'image/png';
                if(file.type === 'image/webp') formatToSelect = 'image/webp';
                document.querySelector(`input[name="format"][value="${formatToSelect}"]`).checked = true;

                updateInputsFromPixels(originalImage.width, originalImage.height);
                updateOriginalInfo();
                
                if (pendingPreset) {
                    window.selectExamPreset(pendingPreset);
                    pendingPreset = null;
                } else {
                    updatePreviewInfo();
                }
            };
        };
        reader.readAsDataURL(file);
    }

    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024, sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function updateOriginalInfo() {
        originalInfo.innerHTML = `<i class="fa-solid fa-image"></i> Original: ${originalImage.width}x${originalImage.height} | ${formatBytes(originalFile.size)}`;
    }

    // Logic for Unit Conversions
    function updateInputsFromPixels(pxW, pxH) {
        if (currentUnit === 'cm') {
            resizeWidth.value = (pxW / PX_PER_CM).toFixed(2);
            resizeHeight.value = (pxH / PX_PER_CM).toFixed(2);
        } else if (currentUnit === 'inch') {
            resizeWidth.value = (pxW / PX_PER_INCH).toFixed(2);
            resizeHeight.value = (pxH / PX_PER_INCH).toFixed(2);
        } else {
            resizeWidth.value = Math.round(pxW);
            resizeHeight.value = Math.round(pxH);
        }
    }

    function getTargetDimensions() {
        let w = parseFloat(resizeWidth.value) || 0;
        let h = parseFloat(resizeHeight.value) || 0;
        
        if (currentUnit === 'cm') {
            w = Math.round(w * PX_PER_CM);
            h = Math.round(h * PX_PER_CM);
        } else if (currentUnit === 'inch') {
            w = Math.round(w * PX_PER_INCH);
            h = Math.round(h * PX_PER_INCH);
        }
        return { w: Math.max(1, w), h: Math.max(1, h) };
    }

    function updatePreviewInfo() {
        if (!originalFile) return;
        newInfo.innerHTML = `<i class="fa-solid fa-compress"></i> Calculating...`;
        updateLivePreview();
    }
    
    let previewTimeout;
    let currentCompressedDataUrl = '';

    function updateLivePreview() {
        if (!originalFile) return;
        clearTimeout(previewTimeout);
        
        previewTimeout = setTimeout(() => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const dims = getTargetDimensions();
            const formatRadio = document.querySelector('input[name="format"]:checked');
            const exportFormat = formatRadio ? formatRadio.value : 'image/jpeg';

            canvas.width = dims.w;
            canvas.height = dims.h;

            if (exportFormat === 'image/jpeg') {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, dims.w, dims.h);
            }
            ctx.drawImage(originalImage, 0, 0, dims.w, dims.h);

            let finalDataUrl = '';
            let finalBytes = 0;
            const targetKb = parseFloat(targetSizeKb.value);
            
            // Helper to get EXACT bytes of base64
            const getBytes = (dataUrl) => {
                const base64str = dataUrl.split(',')[1];
                const padding = (base64str.match(/(=+)$/) || [,''])[1].length;
                return Math.round((base64str.length * 3) / 4) - padding;
            };
            
            if (compressAlso.checked && targetKb > 0 && exportFormat !== 'image/png') {
                let minQ = 0.01; let maxQ = 1.0;
                let quality = 1.0;
                const targetBytes = targetKb * 1024;
                
                // High precision binary search for quality (12 iterations)
                for (let i = 0; i < 12; i++) {
                    quality = (minQ + maxQ) / 2;
                    let tempUrl = canvas.toDataURL(exportFormat, quality);
                    let byteSize = getBytes(tempUrl);
                    
                    if (byteSize > targetBytes) {
                        maxQ = quality;
                    } else {
                        minQ = quality;
                        finalDataUrl = tempUrl; 
                        finalBytes = byteSize;
                    }
                }
                
                if (!finalDataUrl) {
                    finalDataUrl = canvas.toDataURL(exportFormat, 0.05); // Absolute minimum fallback
                    finalBytes = getBytes(finalDataUrl);
                }
            } else {
                finalDataUrl = canvas.toDataURL(exportFormat, 0.9);
                finalBytes = getBytes(finalDataUrl);
            }
            
            currentCompressedDataUrl = finalDataUrl;
            imagePreview.src = finalDataUrl; 
            
            // Show ACTUAL size achieved, not the target!
            let colorClass = '';
            if (compressAlso.checked && targetKb > 0) {
               if (finalBytes > targetKb * 1024) colorClass = 'style="color: #ef4444;"'; // Red if failed to compress
               else colorClass = 'style="color: #34d399;"'; // Green if success
            }
            newInfo.innerHTML = `<i class="fa-solid fa-compress"></i> New: ${dims.w}x${dims.h}px | <span ${colorClass}>Actual: ${formatBytes(finalBytes)}</span>`;
        }, 150);
    }

    // Event Listeners
    formatRadios.forEach(radio => radio.addEventListener('change', updatePreviewInfo));

    unitRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const oldUnit = currentUnit;
            currentUnit = e.target.value;
            
            // Convert current input values to new unit
            const dims = getTargetDimensions(); // Gets current inputs in PX
            updateInputsFromPixels(dims.w, dims.h);
            updatePreviewInfo();
        });
    });

    resizeWidth.addEventListener('input', () => {
        if (maintainAspect.checked) {
            resizeHeight.value = (parseFloat(resizeWidth.value) / aspectRatio).toFixed(currentUnit === 'pixels' ? 0 : 2);
        }
        updatePreviewInfo();
    });

    resizeHeight.addEventListener('input', () => {
        if (maintainAspect.checked) {
            resizeWidth.value = (parseFloat(resizeHeight.value) * aspectRatio).toFixed(currentUnit === 'pixels' ? 0 : 2);
        }
        updatePreviewInfo();
    });

    compressAlso.addEventListener('change', (e) => {
        compressOptions.style.display = e.target.checked ? 'flex' : 'none';
        updatePreviewInfo();
    });
    
    targetSizeKb.addEventListener('input', () => {
        
        // "when image size increase or decrease also change it's dimension according to image size"
        // If user sets a strict target KB, dynamically scale dimensions down if it's impossible to hit with quality alone
        if(compressAlso.checked && targetSizeKb.value) {
           const tKB = parseFloat(targetSizeKb.value);
           if (tKB > 0 && originalFile) {
               // Estimation: a highly compressed JPG at 1000x1000 is ~80KB.
               // Very rough heuristic: required pixels = targetKB * 12000
               const maxPixels = tKB * 12000; 
               const currentPixels = originalImage.width * originalImage.height;
               
               if (currentPixels > maxPixels) {
                   const scaleFactor = Math.sqrt(maxPixels / currentPixels);
                   const newW = originalImage.width * scaleFactor;
                   const newH = originalImage.height * scaleFactor;
                   updateInputsFromPixels(newW, newH);
               }
           }
        }
        updatePreviewInfo();
    });
    
    maintainAspect.addEventListener('change', () => {
        if (maintainAspect.checked) {
            resizeHeight.value = (parseFloat(resizeWidth.value) / aspectRatio).toFixed(currentUnit === 'pixels' ? 0 : 2);
            updatePreviewInfo();
        }
    });

    cancelBtn.addEventListener('click', () => {
        editorArea.style.display = 'none';
        uploadArea.style.display = 'block';
        fileInput.value = '';
        originalFile = null;
    });

    // Processor
    downloadBtn.addEventListener('click', () => {
        if (!originalFile) return;

        downloadBtn.innerHTML = 'Processing...';
        downloadBtn.disabled = true;

        setTimeout(() => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const dims = getTargetDimensions();
            const exportFormat = document.querySelector('input[name="format"]:checked').value;
            
            // If live preview has already generated the image, use it!
            const finalDataUrl = currentCompressedDataUrl || canvas.toDataURL(exportFormat, 0.9);

            const a = document.createElement('a');
            a.href = finalDataUrl;
            const ext = exportFormat.split('/')[1];
            const name = originalFile.name.split('.')[0];
            a.download = `${name}_resized.${ext}`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            downloadBtn.innerHTML = 'Resize Image';
            downloadBtn.disabled = false;
        }, 100);
    });
    
    // --- MULTI-TOOL ROUTER ---
    const allViews = document.querySelectorAll('.tool-view');
    const comingSoonTitle = document.getElementById('comingSoonTitle');

    window.switchTool = function(viewId) {
        allViews.forEach(view => {
            view.style.display = view.id === viewId ? 'block' : 'none';
            if (view.id === 'view-resize' && viewId === 'view-resize') {
                view.style.display = 'block'; // Or whatever default it was
            }
        });
        
        // Adjust for editor-area display rules
        if (viewId === 'view-resize') {
             // Let the existing uploadArea/editorArea visibility remain untouched
             if (originalFile) {
                 document.getElementById('editorArea').style.display = 'flex';
                 document.getElementById('uploadArea').style.display = 'none';
             } else {
                 document.getElementById('editorArea').style.display = 'none';
                 document.getElementById('uploadArea').style.display = 'block';
             }
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.showComingSoon = function(title) {
        comingSoonTitle.innerText = title;
        window.switchTool('view-coming-soon');
    };

    // --- SIGNATURE MAKER TOOL ---
    const sigCanvas = document.getElementById('signatureCanvas');
    if (sigCanvas) {
        const sigCtx = sigCanvas.getContext('2d');
        const sigColor = document.getElementById('sigColor');
        let isDrawing = false;

        // Init white background
        sigCtx.fillStyle = '#FFFFFF';
        sigCtx.fillRect(0, 0, sigCanvas.width, sigCanvas.height);
        sigCtx.lineWidth = 3;
        sigCtx.lineCap = 'round';
        sigCtx.lineJoin = 'round';

        const getPos = (e) => {
            const rect = sigCanvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: (clientX - rect.left) * (sigCanvas.width / rect.width),
                y: (clientY - rect.top) * (sigCanvas.height / rect.height)
            };
        };

        const startDraw = (e) => {
            e.preventDefault();
            isDrawing = true;
            const pos = getPos(e);
            sigCtx.strokeStyle = sigColor.value;
            sigCtx.beginPath();
            sigCtx.moveTo(pos.x, pos.y);
        };

        const draw = (e) => {
            if (!isDrawing) return;
            e.preventDefault();
            const pos = getPos(e);
            sigCtx.lineTo(pos.x, pos.y);
            sigCtx.stroke();
        };

        const endDraw = (e) => {
            if (e) e.preventDefault();
            isDrawing = false;
        };

        sigCanvas.addEventListener('mousedown', startDraw);
        sigCanvas.addEventListener('mousemove', draw);
        sigCanvas.addEventListener('mouseup', endDraw);
        sigCanvas.addEventListener('mouseout', endDraw);

        sigCanvas.addEventListener('touchstart', startDraw, {passive: false});
        sigCanvas.addEventListener('touchmove', draw, {passive: false});
        sigCanvas.addEventListener('touchend', endDraw);

        window.clearSignature = () => {
            sigCtx.fillStyle = '#FFFFFF';
            sigCtx.fillRect(0, 0, sigCanvas.width, sigCanvas.height);
        };

        window.downloadSignature = () => {
            const a = document.createElement('a');
            a.download = 'signature.jpg';
            a.href = sigCanvas.toDataURL('image/jpeg', 1.0);
            a.click();
        };
    }

    // --- IMAGES TO PDF TOOL ---
    const pdfUploadArea = document.getElementById('pdfUploadArea');
    const pdfFileInput = document.getElementById('pdfFileInput');
    const pdfEditorArea = document.getElementById('pdfEditorArea');
    const pdfFileCount = document.getElementById('pdfFileCount');
    const generatePdfBtn = document.getElementById('generatePdfBtn');
    let pdfImages = [];

    if (pdfUploadArea) {
        pdfUploadArea.addEventListener('click', (e) => {
            if(e.target !== pdfFileInput && !e.target.classList.contains('btn-primary')) {
                pdfFileInput.click();
            }
        });

        pdfUploadArea.addEventListener('dragover', (e) => e.preventDefault());
        pdfUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            if (e.dataTransfer.files.length) handlePdfFiles(e.dataTransfer.files);
        });

        pdfFileInput.addEventListener('change', (e) => {
            if (e.target.files.length) handlePdfFiles(e.target.files);
        });
    }

    function handlePdfFiles(fileList) {
        pdfImages = [];
        const validFiles = Array.from(fileList).filter(f => f.type.startsWith('image/'));
        if (validFiles.length === 0) return alert('Please select valid image files.');

        let loadedCount = 0;
        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    pdfImages.push(img);
                    loadedCount++;
                    if (loadedCount === validFiles.length) {
                        pdfUploadArea.style.display = 'none';
                        pdfEditorArea.style.display = 'block';
                        pdfFileCount.innerText = `${pdfImages.length} Images Selected`;
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    window.resetPdfTool = () => {
        pdfImages = [];
        pdfFileInput.value = '';
        pdfEditorArea.style.display = 'none';
        pdfUploadArea.style.display = 'block';
    };

    if (generatePdfBtn) {
        generatePdfBtn.addEventListener('click', () => {
            if (pdfImages.length === 0 || !window.jspdf) return;
            
            generatePdfBtn.innerHTML = 'Generating PDF...';
            generatePdfBtn.disabled = true;

            setTimeout(() => {
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF();
                
                pdfImages.forEach((img, index) => {
                    if (index > 0) pdf.addPage();
                    
                    const pageWidth = pdf.internal.pageSize.getWidth();
                    const pageHeight = pdf.internal.pageSize.getHeight();
                    
                    const imgRatio = img.width / img.height;
                    const pageRatio = pageWidth / pageHeight;
                    
                    let finalW, finalH;
                    if (imgRatio > pageRatio) {
                        finalW = pageWidth;
                        finalH = pageWidth / imgRatio;
                    } else {
                        finalH = pageHeight;
                        finalW = pageHeight * imgRatio;
                    }
                    
                    const x = (pageWidth - finalW) / 2;
                    const y = (pageHeight - finalH) / 2;
                    
                    pdf.addImage(img.src, 'JPEG', x, y, finalW, finalH);
                });

                pdf.save('merged_images.pdf');
                
                generatePdfBtn.innerHTML = 'Generate PDF';
                generatePdfBtn.disabled = false;
            }, 500);
        });
    }

    // --- PDF TO IMAGES TOOL ---
    const pdfToImgUploadArea = document.getElementById('pdfToImgUploadArea');
    const pdfToImgInput = document.getElementById('pdfToImgInput');
    const pdfToImgEditorArea = document.getElementById('pdfToImgEditorArea');
    const pdfToImgCount = document.getElementById('pdfToImgCount');
    const pdfToImgResults = document.getElementById('pdfToImgResults');

    if (pdfToImgUploadArea) {
        pdfToImgUploadArea.addEventListener('click', (e) => {
            if(e.target !== pdfToImgInput && !e.target.classList.contains('btn-primary')) {
                pdfToImgInput.click();
            }
        });
        pdfToImgInput.addEventListener('change', (e) => {
            if (e.target.files.length) handlePdfToImg(e.target.files[0]);
        });
    }

    async function handlePdfToImg(file) {
        if (!window.pdfjsLib) return alert("PDF Engine loading, please wait.");
        pdfToImgUploadArea.style.display = 'none';
        pdfToImgEditorArea.style.display = 'block';
        pdfToImgResults.innerHTML = '';
        pdfToImgCount.innerText = 'Extracting Pages...';

        const fileReader = new FileReader();
        fileReader.onload = async function() {
            const typedarray = new Uint8Array(this.result);
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            const pdf = await window.pdfjsLib.getDocument(typedarray).promise;
            
            pdfToImgCount.innerText = `Extracted ${pdf.numPages} Pages`;
            
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({scale: 2.0}); // High res
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                await page.render({canvasContext: ctx, viewport: viewport}).promise;
                
                const img = document.createElement('img');
                img.src = canvas.toDataURL('image/jpeg', 0.9);
                img.style.width = '120px';
                img.style.height = 'auto';
                img.style.borderRadius = '4px';
                img.style.cursor = 'pointer';
                img.style.border = '1px solid var(--border-color)';
                img.title = 'Click to Download Page ' + pageNum;
                
                img.onclick = () => {
                    const a = document.createElement('a');
                    a.download = `page_${pageNum}.jpg`;
                    a.href = img.src;
                    a.click();
                };
                
                pdfToImgResults.appendChild(img);
            }
        };
        fileReader.readAsArrayBuffer(file);
    }

    window.resetPdfToImgTool = () => {
        pdfToImgInput.value = '';
        pdfToImgEditorArea.style.display = 'none';
        pdfToImgUploadArea.style.display = 'block';
    };

    // --- AI BACKGROUND TOOL ---
    window.currentAiMode = 'remove';
    window.openAiTool = function(mode) {
        window.currentAiMode = mode;
        document.getElementById('aiBgTitle').innerText = mode === 'remove' ? 'Remove Background AI' : 'Blur Background AI';
        window.switchTool('view-ai-bg');
    };

    const aiBgUploadArea = document.getElementById('aiBgUploadArea');
    const aiBgInput = document.getElementById('aiBgInput');
    const aiBgEditorArea = document.getElementById('aiBgEditorArea');
    const aiBgPreview = document.getElementById('aiBgPreview');
    const runAiBtn = document.getElementById('runAiBtn');
    const downloadAiBtn = document.getElementById('downloadAiBtn');
    const aiBgStatus = document.getElementById('aiBgStatus');
    const aiBgOptions = document.getElementById('aiBgOptions');
    const aiBgColor = document.getElementById('aiBgColor');
    const applyAiBgColorBtn = document.getElementById('applyAiBgColorBtn');
    
    let originalAiImage = null;
    let finalAiResult = null; // Stores the current visible result
    let rawForegroundUrl = null; // Stores the pure transparent PNG

    if (aiBgUploadArea) {
        aiBgUploadArea.addEventListener('click', (e) => {
            if(e.target !== aiBgInput && !e.target.classList.contains('btn-primary')) aiBgInput.click();
        });
        aiBgInput.addEventListener('change', (e) => {
            if (e.target.files.length) handleAiFile(e.target.files[0]);
        });
    }

    function handleAiFile(file) {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            aiBgPreview.src = e.target.result;
            originalAiImage = new Image();
            originalAiImage.src = e.target.result;
            
            aiBgUploadArea.style.display = 'none';
            aiBgEditorArea.style.display = 'block';
            runAiBtn.style.display = 'inline-block';
            downloadAiBtn.style.display = 'none';
            aiBgOptions.style.display = 'none';
            aiBgStatus.innerText = 'Ready to Process';
        };
        reader.readAsDataURL(file);
    }

    window.resetAiBgTool = () => {
        aiBgInput.value = '';
        aiBgEditorArea.style.display = 'none';
        aiBgUploadArea.style.display = 'block';
        originalAiImage = null;
        rawForegroundUrl = null;
    };

    window.resetAiBgColor = () => {
        if (!rawForegroundUrl) return;
        finalAiResult = rawForegroundUrl;
        aiBgPreview.src = finalAiResult;
    };

    if (applyAiBgColorBtn) {
        applyAiBgColorBtn.addEventListener('click', () => {
            if (!rawForegroundUrl) return;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = originalAiImage.width;
            canvas.height = originalAiImage.height;
            
            // Draw background color
            ctx.fillStyle = aiBgColor.value;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw foreground over it
            const fgImg = new Image();
            fgImg.onload = () => {
                ctx.drawImage(fgImg, 0, 0);
                finalAiResult = canvas.toDataURL('image/jpeg', 0.9);
                aiBgPreview.src = finalAiResult;
            };
            fgImg.src = rawForegroundUrl;
        });
    }

    if (runAiBtn) {
        runAiBtn.addEventListener('click', async () => {
            if (!originalAiImage) return;
            if (!window.imglyRemoveBackground) {
                alert("AI Engine is still downloading in the background. Please try again in a few seconds.");
                return;
            }
            
            runAiBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing Neural Network...';
            runAiBtn.disabled = true;
            aiBgStatus.innerText = 'Extracting Subject (This takes 10-20 seconds)...';
            
            try {
                // Returns a Blob
                const blob = await window.imglyRemoveBackground(aiBgPreview.src);
                rawForegroundUrl = URL.createObjectURL(blob);
                
                if (window.currentAiMode === 'remove') {
                    finalAiResult = rawForegroundUrl;
                    aiBgPreview.src = finalAiResult;
                    aiBgStatus.innerText = 'Background Removed Successfully!';
                    aiBgOptions.style.display = 'flex'; // Show color tools!
                } else {
                    // BLUR MODE
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = originalAiImage.width;
                    canvas.height = originalAiImage.height;
                    
                    // Draw blurred original
                    ctx.filter = 'blur(12px) brightness(0.9)';
                    ctx.drawImage(originalAiImage, 0, 0);
                    ctx.filter = 'none';
                    
                    // Draw sharp foreground over it
                    const fgImg = new Image();
                    fgImg.onload = () => {
                        ctx.drawImage(fgImg, 0, 0);
                        finalAiResult = canvas.toDataURL('image/jpeg', 0.9);
                        aiBgPreview.src = finalAiResult;
                        aiBgStatus.innerText = 'Portrait Blur Applied Successfully!';
                        
                        runAiBtn.style.display = 'none';
                        downloadAiBtn.style.display = 'inline-block';
                        runAiBtn.disabled = false;
                        runAiBtn.innerText = 'Process Image';
                    };
                    fgImg.src = rawForegroundUrl;
                    return; // Return early because onload is async
                }
                
                runAiBtn.style.display = 'none';
                downloadAiBtn.style.display = 'inline-block';
                runAiBtn.disabled = false;
                runAiBtn.innerText = 'Process Image';
                
            } catch (err) {
                console.error(err);
                aiBgStatus.innerText = 'Error processing image.';
                runAiBtn.disabled = false;
                runAiBtn.innerText = 'Process Image';
            }
        });
    }

    if (downloadAiBtn) {
        downloadAiBtn.addEventListener('click', () => {
            if (!finalAiResult) return;
            const a = document.createElement('a');
            a.download = window.currentAiMode === 'remove' ? 'no_bg.png' : 'blur_bg.jpg';
            a.href = finalAiResult;
            a.click();
        });
    }

    // --- CROP IMAGE TOOL ---
    const cropUploadArea = document.getElementById('cropUploadArea');
    const cropFileInput = document.getElementById('cropFileInput');
    const cropEditorArea = document.getElementById('cropEditorArea');
    const cropImagePreview = document.getElementById('cropImagePreview');
    const performCropBtn = document.getElementById('performCropBtn');
    let cropperInstance = null;
    let originalCropFile = null;

    if (cropUploadArea) {
        cropUploadArea.addEventListener('click', (e) => {
            if(e.target !== cropFileInput && !e.target.classList.contains('btn-primary')) cropFileInput.click();
        });
        cropUploadArea.addEventListener('dragover', (e) => e.preventDefault());
        cropUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            if (e.dataTransfer.files.length) handleCropFile(e.dataTransfer.files[0]);
        });
        cropFileInput.addEventListener('change', (e) => {
            if (e.target.files.length) handleCropFile(e.target.files[0]);
        });
    }

    function handleCropFile(file) {
        if (!file.type.startsWith('image/')) return;
        originalCropFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            cropImagePreview.src = e.target.result;
            cropUploadArea.style.display = 'none';
            cropEditorArea.style.display = 'block';
            
            if (cropperInstance) cropperInstance.destroy();
            cropperInstance = new Cropper(cropImagePreview, {
                viewMode: 1,
                dragMode: 'crop',
                autoCropArea: 0.8,
                responsive: true,
                restore: false,
                guides: true,
                center: true,
                highlight: false,
                cropBoxMovable: true,
                cropBoxResizable: true,
                toggleDragModeOnDblclick: false,
            });
        };
        reader.readAsDataURL(file);
    }

    window.setCropRatio = (ratio) => {
        if (cropperInstance) {
            cropperInstance.setAspectRatio(ratio);
        }
    };

    window.resetCropTool = () => {
        if (cropperInstance) cropperInstance.destroy();
        cropperInstance = null;
        cropFileInput.value = '';
        originalCropFile = null;
        cropEditorArea.style.display = 'none';
        cropUploadArea.style.display = 'block';
    };

    if (performCropBtn) {
        performCropBtn.addEventListener('click', () => {
            if (!cropperInstance || !originalCropFile) return;
            
            performCropBtn.innerHTML = 'Cropping...';
            performCropBtn.disabled = true;
            
            setTimeout(() => {
                const canvas = cropperInstance.getCroppedCanvas();
                if (canvas) {
                    const finalDataUrl = canvas.toDataURL(originalCropFile.type, 0.9);
                    const a = document.createElement('a');
                    const ext = originalCropFile.type.split('/')[1] || 'jpeg';
                    const name = originalCropFile.name.split('.')[0] || 'image';
                    a.download = `${name}_cropped.${ext}`;
                    a.href = finalDataUrl;
                    a.click();
                }
                performCropBtn.innerHTML = 'Crop & Download';
                performCropBtn.disabled = false;
            }, 100);
        });
    }

    // --- IMAGE CONVERTER TOOL ---
    const convertUploadArea = document.getElementById('convertUploadArea');
    const convertFileInput = document.getElementById('convertFileInput');
    const convertEditorArea = document.getElementById('convertEditorArea');
    const convertPreview = document.getElementById('convertPreview');
    const convFixedSize = document.getElementById('convFixedSize');
    const convSizeOptions = document.getElementById('convSizeOptions');
    const convTargetKb = document.getElementById('convTargetKb');
    const convertNowBtn = document.getElementById('convertNowBtn');
    let originalConvertImage = new Image();
    let originalConvertFile = null;

    if (convertUploadArea) {
        convertUploadArea.addEventListener('click', (e) => {
            if(e.target !== convertFileInput && !e.target.classList.contains('btn-primary')) convertFileInput.click();
        });
        convertFileInput.addEventListener('change', (e) => {
            if (e.target.files.length) handleConvertFile(e.target.files[0]);
        });
    }

    function handleConvertFile(file) {
        if (!file.type.startsWith('image/')) return;
        originalConvertFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            originalConvertImage.src = e.target.result;
            originalConvertImage.onload = () => {
                convertUploadArea.style.display = 'none';
                convertEditorArea.style.display = 'block';
                convertPreview.src = originalConvertImage.src;
            };
        };
        reader.readAsDataURL(file);
    }

    convFixedSize.addEventListener('change', (e) => {
        convSizeOptions.style.display = e.target.checked ? 'flex' : 'none';
    });

    window.resetConvertTool = () => {
        originalConvertFile = null;
        convertFileInput.value = '';
        convertEditorArea.style.display = 'none';
        convertUploadArea.style.display = 'block';
    };

    if (convertNowBtn) {
        convertNowBtn.addEventListener('click', () => {
            if (!originalConvertFile) return;
            
            convertNowBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
            convertNowBtn.disabled = true;

            setTimeout(() => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = originalConvertImage.width;
                canvas.height = originalConvertImage.height;
                
                const targetFormat = document.querySelector('input[name="convFormat"]:checked').value;
                const isFixedSize = convFixedSize.checked;
                const targetKb = parseFloat(convTargetKb.value) || 0;

                ctx.fillStyle = '#FFFFFF'; // Background for JPEG
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(originalConvertImage, 0, 0);

                let finalDataUrl = '';
                
                if (isFixedSize && targetKb > 0 && targetFormat !== 'image/png') {
                    // Binary search for quality to hit target KB
                    let minQ = 0.01; let maxQ = 1.0;
                    const targetBytes = targetKb * 1024;
                    
                    for (let i = 0; i < 12; i++) {
                        let q = (minQ + maxQ) / 2;
                        let tempUrl = canvas.toDataURL(targetFormat, q);
                        const base64str = tempUrl.split(',')[1];
                        const byteSize = Math.round((base64str.length * 3) / 4);
                        
                        if (byteSize > targetBytes) maxQ = q;
                        else {
                            minQ = q;
                            finalDataUrl = tempUrl;
                        }
                    }
                } else {
                    finalDataUrl = canvas.toDataURL(targetFormat, 0.92);
                }

                if (!finalDataUrl) finalDataUrl = canvas.toDataURL(targetFormat, 0.1);

                const a = document.createElement('a');
                const ext = targetFormat.split('/')[1];
                const name = originalConvertFile.name.split('.')[0];
                a.download = `${name}_converted.${ext}`;
                a.href = finalDataUrl;
                a.click();

                convertNowBtn.innerHTML = 'Convert & Download';
                convertNowBtn.disabled = false;
            }, 100);
        });
    }
    window.goHome = function(element) {
        window.activateNav(element);
        
        // Reset Resize Tool
        if (originalFile) {
            editorArea.style.display = 'none';
            uploadArea.style.display = 'block';
            fileInput.value = '';
            originalFile = null;
        }
        
        // Reset Other Tools if they have reset functions
        if (window.resetConvertTool) window.resetConvertTool();
        if (window.resetCropTool) window.resetCropTool();
        if (window.resetAiBgTool) window.resetAiBgTool();
        if (window.resetPdfToImgTool) window.resetPdfToImgTool();
        if (window.resetPdfTool) window.resetPdfTool();
        if (window.clearSignature) window.clearSignature();
        if (window.resetFeedbackTool) window.resetFeedbackTool();
        
        window.switchTool('view-resize');
    };

    // --- FEEDBACK / SUGGESTION TOOL ---
    const feedbackForm = document.getElementById('feedbackForm');
    const feedbackSuccess = document.getElementById('feedbackSuccess');

    if (feedbackForm) {
        feedbackForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const submitBtn = feedbackForm.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
            submitBtn.disabled = true;

            // Simulate server delay
            setTimeout(() => {
                feedbackForm.style.display = 'none';
                feedbackSuccess.style.display = 'block';
                submitBtn.innerHTML = 'Submit Suggestion';
                submitBtn.disabled = false;
                feedbackForm.reset();
            }, 1500);
        });
    }

    window.resetFeedbackTool = () => {
        if (feedbackForm) feedbackForm.style.display = 'block';
        if (feedbackSuccess) feedbackSuccess.style.display = 'none';
    };

});
