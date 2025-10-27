import { useState, useRef, useEffect } from 'react';
import './ImageUpload.css';

const ImageUpload = ({ images = [], onChange }) => {
  const fileInputRef = useRef(null);
  const [previewUrls, setPreviewUrls] = useState(images);
  const [selectedImage, setSelectedImage] = useState(null);

  // Sync with parent when images prop changes
  useEffect(() => {
    setPreviewUrls(images);
  }, [images]);

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Calculate new dimensions (max 800px width/height)
          let width = img.width;
          let height = img.height;
          const maxSize = 800;

          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          // Set canvas size
          canvas.width = width;
          canvas.height = height;

          // Draw image on canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to compressed base64 (quality 0.7 = 70%)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedBase64);
        };

        img.onerror = reject;
        img.src = e.target.result;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    // Limit to 3 images max to avoid Firebase document size limit
    const maxImages = 3;
    const currentImageCount = previewUrls.length;
    const remainingSlots = maxImages - currentImageCount;

    if (remainingSlots <= 0) {
      alert(`Máximo ${maxImages} imágenes permitidas. Por favor elimina algunas antes de agregar más.`);
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      alert(`Solo se agregarán ${remainingSlots} imagen(es) para no exceder el límite de ${maxImages} imágenes.`);
    }

    try {
      // Compress and convert images to base64
      const compressedImages = await Promise.all(
        filesToProcess.map(file => compressImage(file))
      );

      // Update state
      const updatedUrls = [...previewUrls, ...compressedImages];
      setPreviewUrls(updatedUrls);

      // Notify parent component
      if (onChange) {
        onChange(updatedUrls);
      }
    } catch (error) {
      console.error('Error compressing images:', error);
      alert('Error al cargar las imágenes. Por favor intenta de nuevo.');
    }
  };

  const handleRemoveImage = (index) => {
    const updatedUrls = previewUrls.filter((_, i) => i !== index);
    setPreviewUrls(updatedUrls);

    // Notify parent component
    if (onChange) {
      onChange(updatedUrls);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  return (
    <div className="image-upload">
      <div className="images-grid">
        {/* Upload Button */}
        <div className="upload-box" onClick={handleUploadClick}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <div className="upload-icon">📸</div>
          <div className="upload-text">Subir Foto</div>
          <div className="upload-hint">Click para seleccionar</div>
        </div>

        {/* Preview Images */}
        {previewUrls.map((url, index) => (
          <div key={index} className="image-preview">
            <img
              src={url}
              alt={`Tenis ${index + 1}`}
              className="preview-img"
              onClick={() => openImageModal(url)}
              style={{ cursor: 'pointer' }}
            />
            <button
              type="button"
              className="remove-image-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveImage(index);
              }}
            >
              ✕
            </button>
            <div className="image-overlay" onClick={() => openImageModal(url)}>
              <div className="overlay-text">Foto {index + 1}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="upload-info">
        <span className="info-icon">ℹ️</span>
        <span className="info-text">
          {previewUrls.length > 0
            ? `${previewUrls.length}/3 ${previewUrls.length === 1 ? 'foto cargada' : 'fotos cargadas'}`
            : 'Máximo 3 fotos (comprimidas automáticamente)'
          }
        </span>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="image-modal" onClick={closeImageModal}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="image-modal-close" onClick={closeImageModal}>
              ✕
            </button>
            <img src={selectedImage} alt="Vista ampliada" className="image-modal-img" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
