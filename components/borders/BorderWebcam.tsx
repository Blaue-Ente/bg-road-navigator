interface BorderWebcamProps {
  url: string;
  label: string;
  refreshIntervalMs?: number;
}

export function BorderWebcam({ url, label, refreshIntervalMs = 30000 }: BorderWebcamProps) {
  return (
    <div className="relative rounded-lg overflow-hidden border border-gray-700 bg-gray-800">
      <img
        src={url}
        alt={label}
        className="w-full h-40 object-cover"
        onError={(e) => {
          e.currentTarget.src = "/placeholder-webcam.png";
        }}
      />
      <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white">
        {label}
      </div>
      <div className="absolute top-2 right-2 text-xs text-gray-300 bg-black/40 px-1 rounded">
        Обновяване: {Math.round(refreshIntervalMs / 1000)}с
      </div>
    </div>
  );
}