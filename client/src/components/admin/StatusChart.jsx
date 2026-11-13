const statusData = [
  {
    label: 'En attente',
    value: 18,
    color: '#d9a928',
  },
  {
    label: 'Confirmée',
    value: 42,
    color: '#5da96c',
  },
  {
    label: 'En préparation',
    value: 28,
    color: '#5986b9',
  },
  {
    label: 'Expédiée',
    value: 67,
    color: '#765db1',
  },
  {
    label: 'Livrée',
    value: 1085,
    color: '#448653',
  },
  {
    label: 'Annulée',
    value: 8,
    color: '#c84c55',
  },
]

export default function StatusChart({
  data = statusData,
}) {
  const chartData = data
  const maxValue = Math.max(
    1,
    ...chartData.map((item) => item.value),
  )

  return (
    <div
      style={{
        width: '100%',
        marginTop: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '13px',
      }}
    >
      {chartData.length === 0 ? (
        <span>Aucune commande trouvee.</span>
      ) : null}

      {chartData.map((item) => {
        const percentage =
          (item.value / maxValue) * 100

        return (
          <div
            key={item.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                fontSize: '11px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#555852',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    flexShrink: 0,
                    borderRadius: '50%',
                    backgroundColor: item.color,
                  }}
                />

                <span>{item.label}</span>
              </div>

              <strong
                style={{
                  color: '#242621',
                  fontWeight: 600,
                }}
              >
                {item.value}
              </strong>
            </div>

            <div
              style={{
                width: '100%',
                height: '6px',
                overflow: 'hidden',
                borderRadius: '999px',
                backgroundColor: '#ebe9e4',
              }}
            >
              <div
                style={{
                  width: `${Math.max(
                    percentage,
                    2,
                  )}%`,
                  height: '100%',
                  borderRadius: '999px',
                  backgroundColor: item.color,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
