import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ImageModal from './ImageModal';

const Step = ({ step, index, images }) => {
  const [modalImage, setModalImage] = useState(null);
  const [beforeImageIndex, setBeforeImageIndex] = useState(0);
  const [afterImageIndex, setAfterImageIndex] = useState(0);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    setBeforeImageIndex(0);
    setAfterImageIndex(0);
  }, [images]);

  const handleCopy = (value, field) => {
    navigator.clipboard.writeText(JSON.stringify(value, null, 2));
    setCopiedField(field);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const renderValue = (value, field) => {
    const isCopyable = ['tool_code', 'tool_output'].includes(field);
    const isThought = field === 'thought';

    let content;
    if (typeof value === 'string') {
      content = <pre>{value}</pre>;
    }
    if (typeof value === 'object' && value !== null) {
      content = <pre>{JSON.stringify(value, null, 2)}</pre>;
    }
    if(content == null) {
        content = <pre>{String(value)}</pre>;
    }

    return (
        <div className={`value-wrapper ${isThought ? 'thought-field' : ''}`}>
            {isCopyable && (
                <button className="copy-button" onClick={() => handleCopy(value, field)}>
                {copiedField === field ? 'Copied!' : 'Copy'}
                </button>
            )}
            {content}
        </div>
    );
  };

  const fieldsToDisplay = ['thought', 'code', 'code_output', 'tool_code', 'tool_name', 'tool_output'];

  const handleNextBefore = () => {
    if (images && images.before) {
      setBeforeImageIndex((prevIndex) => (prevIndex + 1) % images.before.length);
    }
  };

  const handlePrevBefore = () => {
    if (images && images.before) {
      setBeforeImageIndex((prevIndex) => (prevIndex - 1 + images.before.length) % images.before.length);
    }
  };

  const handleNextAfter = () => {
    if (images && images.after) {
      setAfterImageIndex((prevIndex) => (prevIndex + 1) % images.after.length);
    }
  };

  const handlePrevAfter = () => {
    if (images && images.after) {
      setAfterImageIndex((prevIndex) => (prevIndex - 1 + images.after.length) % images.after.length);
    }
  };

  const currentBeforeImage = images?.before?.[beforeImageIndex];
  const currentAfterImage = images?.after?.[afterImageIndex];

  return (
    <div className="step-card">
      <h3 className="step-title">Step {index}</h3>

      {images && images.before?.length > 0 && images.after?.length > 0 ? (
        <div className="image-container">
          <div className="image-wrapper">
            <div className="image-header">
              {images.before.length > 1 && <button className="carousel-button" onClick={handlePrevBefore}>&#8249;</button>}
              <div className="image-info">
                <h3>{currentBeforeImage.name}</h3>
                {images.before.length > 1 && <span className="carousel-counter">{beforeImageIndex + 1} of {images.before.length}</span>}
              </div>
              {images.before.length > 1 && <button className="carousel-button" onClick={handleNextBefore}>&#8250;</button>}
            </div>
            <img src={currentBeforeImage.url} alt={currentBeforeImage.name} onClick={() => setModalImage(currentBeforeImage.url)} />
          </div>
          <div className="image-wrapper">
            <div className="image-header">
              {images.after.length > 1 && <button className="carousel-button" onClick={handlePrevAfter}>&#8249;</button>}
              <div className="image-info">
                <h3>{currentAfterImage.name}</h3>
                {images.after.length > 1 && <span className="carousel-counter">{afterImageIndex + 1} of {images.after.length}</span>}
              </div>
              {images.after.length > 1 && <button className="carousel-button" onClick={handleNextAfter}>&#8250;</button>}
            </div>
            <img src={currentAfterImage.url} alt={currentAfterImage.name} onClick={() => setModalImage(currentAfterImage.url)} />
          </div>
        </div>
      ) : (
        <p>No images provided for this step.</p>
      )}

      {fieldsToDisplay.map(field => (
        step[field] && (
          <div key={field} className="step-section">
            <h4 className="step-key">{field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
            {renderValue(step[field], field)}
          </div>
        )
      ))}
      {modalImage && <ImageModal src={modalImage} alt="Enlarged view" onClose={() => setModalImage(null)} />}
    </div>
  );
};

Step.propTypes = {
  step: PropTypes.shape({
    thought: PropTypes.any,
    code: PropTypes.any,
    code_output: PropTypes.any,
    tool_code: PropTypes.any,
    tool_name: PropTypes.any,
    tool_output: PropTypes.any,
  }).isRequired,
  index: PropTypes.number.isRequired,
  images: PropTypes.shape({
    before: PropTypes.arrayOf(PropTypes.shape({
      url: PropTypes.string,
      name: PropTypes.string,
    })),
    after: PropTypes.arrayOf(PropTypes.shape({
      url: PropTypes.string,
      name: PropTypes.string,
    })),
  }),
};

export default Step;
