interface BarDatum {
  label: string
  value: number
}

export default function AnalyticsChart({ data }: { data: BarDatum[] }) {
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="chart">
      {data.map((d) => (
        <div className="chart-row" key={d.label}>
          <span className="chart-label">{d.label}</span>
          <div className="chart-track">
            <div
              className="chart-bar"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
          <span className="chart-value">{d.value}</span>
        </div>
      ))}
    </div>
  )
}
