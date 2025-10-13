import { useState, useRef, useEffect } from 'react';
import './ImageUpload.css';

const ImageUpload = ({ images = [], onChange }) => {
  const fileInputRef = useRef(null);
  const [previewUrls, setPreviewUrls] = useState(images);

  // Sync with parent when images prop changes
  useEffect(() => {
    setPreviewUrls(images);
  }, [images]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));

    // Update state
    const updatedUrls = [...previewUrls, ...newPreviewUrls];
    setPreviewUrls(updatedUrls);

    // Notify parent component
    if (onChange) {
      onChange(updatedUrls);
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
            <img src={url} alt={`Tenis ${index + 1}`} className="preview-img" />
            <button
              type="button"
              className="remove-image-btn"
              onClick={() => handleRemoveImage(index)}
            >
              ✕
            </button>
            <div className="image-overlay">
              <div className="overlay-text">Foto {index + 1}</div>
            </div>
          </div>
        ))}
      </div>

      {previewUrls.length > 0 && (
        <div className="upload-info">
          <span className="info-icon">ℹ️</span>
          <span className="info-text">
            {previewUrls.length} {previewUrls.length === 1 ? 'foto cargada' : 'fotos cargadas'}
          </span>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
