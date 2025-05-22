import React from "react";
import { FilterList, Sort } from "@mui/icons-material";
import "../styles/FilterPanel.css";

const FilterPanel = ({
  filters,
  onFilterChange,
  showFilters,
  onToggleFilters,
}) => {
  return (
    <>
      <div className="filter-controls">
        <button className="filter-btn" onClick={onToggleFilters}>
          <FilterList /> סינון
        </button>
        <div className="sort-dropdown">
          <Sort />
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange("sortBy", e.target.value)}
          >
            <option value="newest">חדש ביותר</option>
            <option value="priceAsc">מחיר: מהנמוך לגבוה</option>
            <option value="priceDesc">מחיר: מהגבוה לנמוך</option>
            <option value="popular">הכי פופולרי</option>
          </select>
        </div>
      </div>

      <div className={`filters-panel ${showFilters ? "show" : ""}`}>
        <div className="filter-group">
          <h3>קטגוריה</h3>
          <select
            value={filters.category}
            onChange={(e) => onFilterChange("category", e.target.value)}
          >
            <option value="">הכל</option>
            <option value="dresses">שמלות</option>
            <option value="tops">חולצות</option>
            <option value="bottoms">מכנסיים</option>
            <option value="outerwear">מעילים</option>
            <option value="accessories">אקססוריז</option>
          </select>
        </div>

        <div className="filter-group">
          <h3>טווח מחירים</h3>
          <select
            value={filters.priceRange}
            onChange={(e) => onFilterChange("priceRange", e.target.value)}
          >
            <option value="">הכל</option>
            <option value="0-50">עד ₪50</option>
            <option value="50-100">₪50 - ₪100</option>
            <option value="100-200">₪100 - ₪200</option>
            <option value="200+">₪200 ומעלה</option>
          </select>
        </div>

        <div className="filter-group">
          <h3>מידה</h3>
          <div className="size-buttons">
            {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
              <button
                key={size}
                className={filters.size === size ? "active" : ""}
                onClick={() => onFilterChange("size", size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <h3>סוג גוף</h3>
          <select
            value={filters.bodyType}
            onChange={(e) => onFilterChange("bodyType", e.target.value)}
          >
            <option value="">הכל</option>
            <option value="hourglass">שעון חול</option>
            <option value="pear">אגס</option>
            <option value="apple">תפוח</option>
            <option value="rectangle">מלבן</option>
          </select>
        </div>

        <div className="filter-group">
          <h3>סינון נוסף</h3>
          <label>
            <input
              type="checkbox"
              checked={filters.onSale}
              onChange={(e) => onFilterChange("onSale", e.target.checked)}
            />
            במבצע
          </label>
          <label>
            <input
              type="checkbox"
              checked={filters.inStock}
              onChange={(e) => onFilterChange("inStock", e.target.checked)}
            />
            במלאי
          </label>
        </div>
      </div>
    </>
  );
};

export default FilterPanel;
