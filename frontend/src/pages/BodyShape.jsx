import React from 'react';
import '../styles/BodyShape.css';

const BodyShape = () => {
  const bodyShapes = [
    { type: 'שעון חול', description: 'איזון מושלם בין הכתפיים למותניים' },
    { type: 'אגס', description: 'מותינים רחבות יותר מהכתפיים' },
    { type: 'ספורטיבי', description: 'מבנה ישר וספורטיבי' },
    { type: 'תפוח', description: 'חלק אמצעי מלא יותר' }
  ];

  const [selectedShape, setSelectedShape] = React.useState(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleShapeClick = (shape) => {
    setSelectedShape(shape);
    setIsModalOpen(true);
  };

  return (
    <div className="body-shape-container">
      <h1>מבני גוף</h1>
      <div className="shape-grid">
        {bodyShapes.map((shape, index) => (
          <div 
            key={index} 
            className="shape-card"
            onClick={() => handleShapeClick(shape)}
          >
            <div className="shape-svg-container">
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <path 
                  d={getShapePath(shape.type)} 
                  stroke="white" 
                  strokeWidth="2" 
                  fill="#f0f0f0"
                />
              </svg>
            </div>
            <h3>{shape.type}</h3>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close" 
              onClick={() => setIsModalOpen(false)}
            >
              ×
            </button>
            <div className="modal-shape-info">
              <h1>{selectedShape?.type}</h1>
              <p>{selectedShape?.description}</p>
              <div className="modal-shape-svg">
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <path 
                    d={getShapePath(selectedShape?.type)} 
                    stroke="white" 
                    strokeWidth="2" 
                    fill="#f0f0f0"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const getShapePath = (type) => {
  const paths = {
    'שעון חול': 'M30 10 C50 10 70 10 70 10 C70 30 60 40 50 50 C40 60 30 70 30 90 C50 90 70 90 70 90 C70 70 60 60 50 50 C40 40 30 30 30 10',
    'אגס': 'M40 10 C50 10 60 10 60 10 C60 30 55 40 50 50 C45 60 30 70 30 90 C50 95 70 95 70 90 C70 70 55 60 50 50 C45 40 40 30 40 10',
    'ספורטיבי': 'M35 10 C45 10 55 10 65 10 C65 30 65 70 65 90 C55 90 45 90 35 90 C35 70 35 30 35 10',
    'תפוח': 'M40 10 C50 10 60 10 60 10 C65 30 70 40 70 50 C70 70 60 80 50 80 C40 80 30 70 30 50 C30 40 35 30 40 10'
  };
  return paths[type] || '';
};

export default BodyShape;
