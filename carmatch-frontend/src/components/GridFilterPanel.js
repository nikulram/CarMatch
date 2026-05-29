// src/components/GridFilterPanel.js
import { useEffect, useState } from "react";
import Fuse from "fuse.js";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import "./GridFilterPanel.css";
import { FaChevronLeft } from "react-icons/fa";

export default function GridFilterPanel({ cars, onFilter, onBack }) {
  const [search, setSearch] = useState("");
  const [yearRange, setYearRange] = useState([2000, 2025]);
  const [priceRange, setPriceRange] = useState([1000, 100000]);
  const [mileageRange, setMileageRange] = useState([0, 150000]);
  const [sortBy, setSortBy] = useState("price-asc");

  useEffect(() => {
    if (!cars || cars.length === 0) return;

    const years = cars.map(c => c.year).filter(Boolean);
    const prices = cars.map(c => c.price).filter(p => typeof p === "number");
    const mileages = cars.map(c => c.mileage === "N/A" ? 0 : parseInt(c.mileage));

    setYearRange([Math.min(...years), Math.max(...years)]);
    setPriceRange([Math.min(...prices), Math.max(...prices)]);
    setMileageRange([Math.min(...mileages), Math.max(...mileages)]);
  }, [cars]);

  useEffect(() => {
    if (!cars || cars.length === 0) return;

    const fuse = new Fuse(cars, {
      keys: ["make", "model", "year"],
      threshold: 0.4,
    });

    const baseResults = search.trim() ? fuse.search(search).map(r => r.item) : cars;

    const rangeFiltered = baseResults.filter(car => {
      const mileage = car.mileage === "N/A" ? 0 : parseInt(car.mileage);
      return (
        car.year >= yearRange[0] && car.year <= yearRange[1] &&
        car.price >= priceRange[0] && car.price <= priceRange[1] &&
        mileage >= mileageRange[0] && mileage <= mileageRange[1]
      );
    });

    const sorted = [...rangeFiltered].sort((a, b) => {
      switch (sortBy) {
        case "price-asc": return a.price - b.price;
        case "price-desc": return b.price - a.price;
        case "year-desc": return b.year - a.year;
        case "year-asc": return a.year - b.year;
        case "mileage-asc": return (a.mileage || 0) - (b.mileage || 0);
        default: return 0;
      }
    });

    onFilter(sorted);
  }, [search, yearRange, priceRange, mileageRange, sortBy, cars, onFilter]);

  return (
    <div className="filter-panel">
      <div className="search-input-wrapper">
        <input
          className="filter-search"
          placeholder="Search by make, model, year..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="back-btn" onClick={onBack}>
          <FaChevronLeft />
        </button>
      </div>

      <div className="slider-group">
        <label>Year Range:</label>
        <div className="editable-range">
          <input value={yearRange[0]} onChange={e => setYearRange([+e.target.value, yearRange[1]])} />
          <input value={yearRange[1]} onChange={e => setYearRange([yearRange[0], +e.target.value])} />
        </div>
        <Slider range min={1980} max={2030} value={yearRange} onChange={setYearRange} />
      </div>

      <div className="slider-group">
        <label>Price Range ($):</label>
        <div className="editable-range">
          <input value={priceRange[0]} onChange={e => setPriceRange([+e.target.value, priceRange[1]])} />
          <input value={priceRange[1]} onChange={e => setPriceRange([priceRange[0], +e.target.value])} />
        </div>
        <Slider range min={1000} max={1500000} step={500} value={priceRange} onChange={setPriceRange} />
      </div>

      <div className="slider-group">
        <label>Mileage Range (mi):</label>
        <div className="editable-range">
          <input value={mileageRange[0]} onChange={e => setMileageRange([+e.target.value, mileageRange[1]])} />
          <input value={mileageRange[1]} onChange={e => setMileageRange([mileageRange[0], +e.target.value])} />
        </div>
        <Slider range min={0} max={200000} step={1000} value={mileageRange} onChange={setMileageRange} />
      </div>

      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-dropdown">
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
        <option value="year-desc">Year: New to Old</option>
        <option value="year-asc">Year: Old to New</option>
        <option value="mileage-asc">Mileage: Low to High</option>
      </select>
    </div>
  );
}
