export default function PipelineVisual() {
  return (
    <div className="relative w-full h-full flex flex-col justify-center overflow-hidden">
      <svg viewBox="0 0 480 560" className="w-full h-auto max-h-[520px]" fill="none">
        {/* document stack */}
        <g>
          {[0, 1, 2].map((i) => (
            <rect
              key={i}
              x={40 + i * 6}
              y={60 - i * 6}
              width="140"
              height="180"
              rx="6"
              fill="#12151c"
              stroke="#252a37"
              strokeWidth="1"
            />
          ))}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect
              key={i}
              x="58"
              y={40 + i * 22}
              width={i % 2 === 0 ? 100 : 70}
              height="6"
              rx="3"
              fill="#252a37"
            />
          ))}
        </g>

        {/* flow line document -> nodes */}
        <path
          d="M 200 130 C 260 130, 260 200, 320 200"
          stroke="#3b82f6"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity="0.6"
        >
          <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1.2s" repeatCount="indefinite" />
        </path>

        {/* vector node graph */}
        <g>
          {[
            [340, 160],
            [400, 190],
            [370, 240],
            [420, 260],
            [350, 300],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={i === 0 ? 7 : 5} fill="#0d0f14" stroke="#3b82f6" strokeWidth="1.5">
              <animate
                attributeName="r"
                values={`${i === 0 ? 7 : 5};${i === 0 ? 9 : 7};${i === 0 ? 7 : 5}`}
                dur="2.4s"
                begin={`${i * 0.3}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
          <line x1="340" y1="160" x2="400" y2="190" stroke="#252a37" strokeWidth="1" />
          <line x1="340" y1="160" x2="370" y2="240" stroke="#252a37" strokeWidth="1" />
          <line x1="370" y1="240" x2="420" y2="260" stroke="#252a37" strokeWidth="1" />
          <line x1="370" y1="240" x2="350" y2="300" stroke="#252a37" strokeWidth="1" />
        </g>

        {/* flow to answer card */}
        <path
          d="M 370 300 C 320 360, 260 380, 190 400"
          stroke="#22d3a8"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity="0.6"
        >
          <animate attributeName="stroke-dashoffset" from="0" to="20" dur="1.4s" repeatCount="indefinite" />
        </path>

        {/* answer card with citation chips */}
        <g>
          <rect x="40" y="400" width="150" height="110" rx="8" fill="#12151c" stroke="#22d3a8" strokeOpacity="0.4" strokeWidth="1" />
          <rect x="56" y="418" width="118" height="5" rx="2.5" fill="#3a3f4c" />
          <rect x="56" y="432" width="90" height="5" rx="2.5" fill="#3a3f4c" />
          <rect x="56" y="446" width="100" height="5" rx="2.5" fill="#3a3f4c" />
          <rect x="56" y="470" width="26" height="16" rx="4" fill="#0d2f28" stroke="#22d3a8" strokeWidth="1" />
          <text x="63" y="482" fontSize="9" fill="#22d3a8" fontFamily="monospace">[1]</text>
          <rect x="88" y="470" width="26" height="16" rx="4" fill="#0d2f28" stroke="#22d3a8" strokeWidth="1" />
          <text x="95" y="482" fontSize="9" fill="#22d3a8" fontFamily="monospace">[2]</text>
        </g>
      </svg>
    </div>
  );
}
