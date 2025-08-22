// Initialize current date/time
function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    document.getElementById('currentDateTime').textContent = now.toLocaleDateString('en-US', options);
}
updateDateTime();

// File upload handling
document.querySelectorAll('.drop-zone').forEach(dropZone => {
    const input = dropZone.querySelector('input[type="file"]');
    const preview = dropZone.parentElement.querySelector('.photo-preview');

    dropZone.addEventListener('click', () => input.click());
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files, preview);
    });
    input.addEventListener('change', (e) => handleFiles(e.target.files, preview));
});

function handleFiles(files, previewContainer) {
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            
            const captionInput = document.createElement('input');
            captionInput.type = 'text';
            captionInput.placeholder = 'Add caption...';
            captionInput.className = 'caption-input';
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-photo';
            removeBtn.innerHTML = '×';
            removeBtn.onclick = () => photoItem.remove();
            
            photoItem.appendChild(img);
            photoItem.appendChild(captionInput);
            photoItem.appendChild(removeBtn);
            
            previewContainer.appendChild(photoItem);
        }
    });
}

// Signature canvas
const canvas = document.getElementById('signatureCanvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;

// Make canvas responsive
function resizeCanvas() {
    const container = canvas.parentElement;
    const maxWidth = Math.min(container.clientWidth - 40, 400);
    const ratio = maxWidth / 400;
    canvas.style.width = maxWidth + 'px';
    canvas.style.height = (200 * ratio) + 'px';
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    canvas.dispatchEvent(mouseEvent);
});

function startDrawing(e) {
    isDrawing = true;
    draw(e);
}

function draw(e) {
    if (!isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function stopDrawing() {
    isDrawing = false;
    ctx.beginPath();
}

document.getElementById('clearSignature').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Form submission
document.getElementById('inspectionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = collectFormData();
    await generatePDF(formData);
});

function collectFormData() {
    const sections = document.querySelectorAll('.section');
    const data = {
        timestamp: new Date().toLocaleString(),
        inspectorName: document.getElementById('inspectorName').value || 'Not provided',
        sections: [],
        signature: canvas.toDataURL()
    };
    
    sections.forEach(section => {
        const sectionName = section.querySelector('h3').textContent;
        const notes = section.querySelector('textarea').value;
        const statusRadio = section.querySelector('input[type="radio"]:checked');
        const status = statusRadio ? statusRadio.value : 'not-set';
        const photos = [];
        
        section.querySelectorAll('.photo-item').forEach((photo, index) => {
            const img = photo.querySelector('img');
            const caption = photo.querySelector('.caption-input').value;
            photos.push({
                src: img.src,
                caption: caption || `Photo ${index + 1}`
            });
        });
        
        data.sections.push({
            name: sectionName,
            status: status,
            notes: notes,
            photos: photos
        });
    });
    
    return data;
}

async function generatePDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Building 1 – Owner Weekly Inspection Report', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Generated: ${data.timestamp}`, 20, 35);
    doc.text(`Inspector: ${data.inspectorName}`, 20, 45);
    
    let yPos = 60;
    
    data.sections.forEach(section => {
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }
        
        // Section header
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text(section.name, 20, yPos);
        yPos += 8;
        
        // Status
        const statusText = section.status === 'acceptable' ? '✓ ACCEPTABLE' : 
                          section.status === 'not-acceptable' ? '✗ NOT ACCEPTABLE' : 'Status: Not Set';
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(statusText, 20, yPos);
        yPos += 10;
        
        // Notes
        if (section.notes) {
            const splitNotes = doc.splitTextToSize(section.notes, 170);
            doc.text(splitNotes, 20, yPos);
            yPos += splitNotes.length * 5 + 10;
        }
        
        // Photos
        section.photos.forEach(photo => {
            if (yPos > 180) {
                doc.addPage();
                yPos = 20;
            }
            
            try {
                doc.addImage(photo.src, 'JPEG', 20, yPos, 50, 40);
                doc.text(photo.caption, 80, yPos + 20);
                yPos += 50;
            } catch (e) {
                doc.text(`Photo: ${photo.caption}`, 20, yPos);
                yPos += 10;
            }
        });
        
        yPos += 10;
    });
    
    // Signature
    if (data.signature) {
        doc.addPage();
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Inspector Signature:', 20, 30);
        doc.addImage(data.signature, 'PNG', 20, 40, 100, 50);
    }
    
    doc.save(`Building1-Inspection-${new Date().toISOString().split('T')[0]}.pdf`);
}
