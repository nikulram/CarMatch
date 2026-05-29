import { useEffect } from "react";
import "./ARViewer.css";

export default function ARViewer() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="ar-wrapper">
      <div className="ar-header">
        <h2>3D Car Viewer</h2>
        <p>If supported, you can move your phone to see the vehicle in AR.</p>
      </div>

      <div className="ar-frame">
        <a-scene embedded arjs>
          <a-marker preset="hiro">
            <a-box position="0 0.5 0" material="color: red;"></a-box>
          </a-marker>
          <a-entity camera></a-entity>
        </a-scene>
      </div>

      <div className="ar-actions">
        <button onClick={() => window.history.back()}>Go Back</button>
      </div>
    </div>
  );
}
