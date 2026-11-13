const currentMonth = [
  4200,
  5600,
  5100,
  7200,
  6800,
  8900,
  7600,
  9800,
  8400,
  11200,
  9800,
  12600,
]

const previousMonth = [
  3500,
  4200,
  4600,
  5100,
  5800,
  6200,
  6600,
  7100,
  7600,
  8200,
  8700,
  9300,
]

const monthlyLabels = [
  '1 Sep',
  '3 Sep',
  '5 Sep',
  '7 Sep',
  '9 Sep',
  '11 Sep',
  '13 Sep',
  '15 Sep',
  '17 Sep',
  '19 Sep',
  '21 Sep',
  '23 Sep',
]

const chartSeries = {
  monthly: {
    current: currentMonth,
    previous: previousMonth,
    labels: monthlyLabels,
  },
  weekly: {
    current: [18200, 22500, 26400, 31800, 28600, 34700],
    previous: [15600, 18800, 21300, 24600, 26100, 29200],
    labels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'],
  },
  daily: {
    current: [1200, 1800, 1600, 2100, 2400, 1900, 2700],
    previous: [900, 1400, 1300, 1700, 1800, 1600, 2200],
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
  },
}

function createPoints(data, width, height, maxValue) {
  return data
    .map((value, index) => {
      const x =
        (index / (data.length - 1)) * width

      const y =
        height - (value / maxValue) * height

      return `${x},${y}`
    })
    .join(' ')
}

export default function SalesChart({
  period = 'monthly',
  data,
}) {
  const width = 800
  const height = 220
  const selectedSeries =
    data?.current?.length
      ? data
      : chartSeries[period] || chartSeries.monthly
  const maxValue =
    Math.max(
      1000,
      Math.ceil(
        Math.max(
          ...selectedSeries.current,
          ...(selectedSeries.previous || []),
        ) / 1000,
      ) *
        1000 *
        1.15,
    )

  const currentPoints = createPoints(
    selectedSeries.current,
    width,
    height,
    maxValue,
  )

  const previousPoints = createPoints(
    selectedSeries.previous || [],
    width,
    height,
    maxValue,
  )

  return (
    <div className="sales-chart">
      <div className="sales-chart__body">
        <div className="sales-chart__y-axis">
          <span>15 000</span>
          <span>12 000</span>
          <span>9 000</span>
          <span>6 000</span>
          <span>3 000</span>
          <span>0</span>
        </div>

        <div className="sales-chart__graph">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="salesGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#485143"
                  stopOpacity="0.22"
                />

                <stop
                  offset="100%"
                  stopColor="#485143"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>

            {[0, 1, 2, 3, 4, 5].map((line) => {
              const y = (line / 5) * height

              return (
                <line
                  key={line}
                  x1="0"
                  y1={y}
                  x2={width}
                  y2={y}
                  className="sales-chart__grid-line"
                />
              )
            })}

            <polygon
              points={`0,${height} ${currentPoints} ${width},${height}`}
              fill="url(#salesGradient)"
            />

            <polyline
              points={previousPoints}
              className="sales-chart__line sales-chart__line--previous"
            />

            <polyline
              points={currentPoints}
              className="sales-chart__line sales-chart__line--current"
            />

            {selectedSeries.current.map((value, index) => {
              const x =
                (index / (selectedSeries.current.length - 1)) * width

              const y =
                height - (value / maxValue) * height

              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="4"
                  className="sales-chart__point"
                />
              )
            })}
          </svg>

          <div className="sales-chart__x-axis">
            {(selectedSeries.labels || []).map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
