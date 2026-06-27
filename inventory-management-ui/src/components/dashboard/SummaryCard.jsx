function SummaryCard(props) {
  return (
    <div className="col-md-6 mb-3">
      <div className="card shadow-sm border-0 h-100">
        <div className="card-body text-center">
          <i className={`bi ${props.icon} text-${props.color} fs-2`}></i>

          <h6 className="text-muted mt-3 mb-1">{props.title}</h6>

          <h3 className={`text-${props.color} fw-bold mb-0`}>
            {props.value}
          </h3>
        </div>
      </div>
    </div>
  );
}

export default SummaryCard;