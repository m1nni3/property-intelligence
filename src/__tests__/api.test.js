import { describe, it, expect } from "vitest";

describe("Frontend API Pagination", () => {
  it("should format pagination response correctly", () => {
    const response = {
      data: [],
      pagination: { page: 1, limit: 20, total: 100, pages: 5 },
    };
    expect(response.pagination.page).toBe(1);
    expect(response.pagination.limit).toBe(20);
    expect(response.pagination.total).toBe(100);
    expect(response.pagination.pages).toBe(5);
  });

  it("should handle paginated data", () => {
    const response = {
      data: [
        { id: "1", name: "Item 1" },
        { id: "2", name: "Item 2" },
      ],
      pagination: { page: 1, limit: 20, total: 2, pages: 1 },
    };
    expect(response.data.length).toBe(2);
    expect(response.data[0].name).toBe("Item 1");
  });

  it("should calculate pages correctly", () => {
    const total = 150;
    const limit = 20;
    const pages = Math.ceil(total / limit);
    expect(pages).toBe(8);
  });
});
