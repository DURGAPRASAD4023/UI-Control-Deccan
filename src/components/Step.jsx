import PropTypes from 'prop-types';

const Step = ({ step, index }) => {

  // A helper function to render any value. It handles objects by turning them into formatted JSON strings.
  const renderValue = (value) => {
    if (typeof value === 'string') {
      // Return the string directly, wrapped in a <pre> tag to preserve whitespace and formatting.
      return <pre>{value}</pre>;
    }
    if (typeof value === 'object' && value !== null) {
      // If the value is an object or array, format it as a JSON string with indentation for readability.
      return <pre>{JSON.stringify(value, null, 2)}</pre>;
    }
    // For any other type (number, boolean, etc.), convert it to a string and wrap in a <pre> tag.
    return <pre>{String(value)}</pre>;
  };

  // An array of fields that we want to display from the step object.
  const fieldsToDisplay = ['thought', 'code', 'code_output', 'tool_code', 'tool_name', 'tool_output'];

  return (
    <div className="step-card">
      <h3>Step {index + 1}</h3>
      {fieldsToDisplay.map(field => (
        // We only render a section if the field exists and is not null/undefined.
        step[field] && (
          <div key={field} className="step-section">
            <h4>{field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
            {renderValue(step[field])}
          </div>
        )
      ))}
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
};

export default Step;
