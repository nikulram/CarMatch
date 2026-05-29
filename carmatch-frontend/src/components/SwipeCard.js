// src/components/SwipeCard.js
import { motion } from "framer-motion";
import "./SwipeCard.css";

export default function SwipeCard({ car, onSwipe, isTop }) {
  const handleDragEnd = (event, info) => {
    const offsetX = info.offset.x;
    const velocityX = info.velocity.x;

    if (!isTop) return;

    if (Math.abs(offsetX) > 100 || Math.abs(velocityX) > 500) {
      const direction = offsetX > 0 ? "right" : "left";
      onSwipe(direction, car);
    }
  };

  // Extra guard: don't render if sold
  if (car.sold) return null;

  return (
    <motion.div
      className="swipe-card"
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.3}
      onDragEnd={handleDragEnd}
      initial={{ scale: 1, opacity: 1 }}
      animate={{ scale: 1, opacity: 1 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300 }}
      style={{ position: "absolute", zIndex: isTop ? 2 : 1 }}
    >
      <img src={car.image[0]} alt={car.make} />
      <div className="swipe-card-details">
        <h3>{car.make} {car.model}</h3>
        <p>{car.year} • ${car.price}</p>
        <p>{car.vehicleType}</p>
      </div>
    </motion.div>
  );
}
