import React, { useState } from "react";

export default function SearchableList({
  items,
  onSelect,
  renderItem,
  searchFields = ["name"],
  itemsPerPage = 10,
  className = "",
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter items based on search term
  const filteredItems = items.filter((item) =>
    searchFields.some((field) =>
      String(item[field]).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top of list
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={`searchable-list ${className}`}>
      <div className="search-container">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset to first page when searching
          }}
          className="search-input"
        />
      </div>

      <div className="list-container">
        {paginatedItems.length === 0 ? (
          <div className="no-results">No results found</div>
        ) : (
          paginatedItems.map((item) => renderItem(item))
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (page) =>
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
            )
            .map((page) => (
              <React.Fragment key={page}>
                {page !== 1 &&
                  page !== currentPage - 1 &&
                  page !== currentPage + 1 &&
                  page !== totalPages && (
                    <span className="pagination-ellipsis">...</span>
                  )}
                <button
                  onClick={() => handlePageChange(page)}
                  className={`pagination-button ${
                    currentPage === page ? "active" : ""
                  }`}
                >
                  {page}
                </button>
              </React.Fragment>
            ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
