import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, rgb(12, 60, 50) 0%, rgb(199, 144, 55) 100%)",
          color: "white",
          fontSize: 34,
          fontWeight: 700,
          borderRadius: 16,
        }}
      >
        M
      </div>
    ),
    size
  );
}
