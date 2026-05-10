const LoadingSpinner = ({ text = "Loading..." }) => {
  return (
    <div className="spinner-wrap" role="status" aria-live="polite">
      <span className="spinner" />
      <p>{text}</p>
    </div>
  );
};

export default LoadingSpinner;
