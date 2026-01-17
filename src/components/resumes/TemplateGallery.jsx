import { useEffect, useState } from "react";
import { ResumeApi } from "../../services/resumeApi";

export default function TemplateGallery({
  selectedTheme,
  onSelectTheme,
  loading: externalLoading,
  showPreview = false,
}) {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoveredTheme, setHoveredTheme] = useState(null);

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    setLoading(true);
    setError("");

    try {
      // Gọi API backend để lấy danh sách themes
      const backendThemes = await ResumeApi.getThemes();
      setThemes(backendThemes);
    } catch (err) {
      console.error("Error loading themes:", err);
      setError("Không thể tải danh sách themes. Vui lòng thử lại.");

      // Fallback: chỉ sử dụng 2 templates cố định
      const fallbackThemes = [
        {
          id: "classic",
          name: "Classic Professional",
          description:
            "ATS-friendly template với layout truyền thống, phù hợp cho corporate jobs",
          layout: "header-top",
          category: "professional",
          isAtsFriendly: true,
          colors: {
            primary: "#1e40af",
            secondary: "#3b82f6",
            accent: "#60a5fa",
            text: "#1e293b",
            background: "#ffffff",
          },
        },
        {
          id: "modern",
          name: "Modern Impact",
          description:
            "Personal branding template với design sáng tạo, phù hợp cho tech/startup",
          layout: "sidebar",
          category: "modern",
          isAtsFriendly: false,
          colors: {
            primary: "#7c3aed",
            secondary: "#a855f7",
            accent: "#c084fc",
            text: "#1e293b",
            background: "#ffffff",
          },
        },
      ];
      setThemes(fallbackThemes);
    } finally {
      setLoading(false);
    }
  };

  if (loading || externalLoading) {
    return (
      <div className="template-gallery">
        <div className="template-gallery__loading">
          <div
            className="spinner"
            style={{ width: "24px", height: "24px", margin: "0 auto 12px" }}
          />
          Đang tải template...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="template-gallery">
        <div className="error-banner">{error}</div>
      </div>
    );
  }

  const selectedThemeData = themes.find((t) => t.id === selectedTheme);

  return (
    <div className="template-gallery">
      {showPreview && selectedThemeData && (
        <div className="template-gallery__selected-preview">
          <div className="template-gallery__selected-badge">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M13.5 4L6 11.5L2.5 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Đã chọn
          </div>
          <h4 className="template-gallery__preview-title">
            {selectedThemeData.name}
          </h4>
          {selectedThemeData.description && (
            <p className="template-gallery__preview-description muted small">
              {selectedThemeData.description}
            </p>
          )}
        </div>
      )}
      <div className="template-gallery__grid">
        {themes.map((theme) => {
          const isSelected = selectedTheme === theme.id;
          const colors = theme.colors || {};
          const layout = theme.layout || "sidebar";

          // Simple preview for unified templates
          const renderPreview = () => {
            const primaryColor = colors.primary || "#1e293b";

            if (layout === "header-top") {
              // Classic Professional: header-top layout
              return (
                <div
                  className="template-card__preview"
                  style={{
                    background: primaryColor,
                    borderRadius: "4px",
                    height: "120px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  <div style={{ marginBottom: "8px" }}>📄</div>
                  Classic
                </div>
              );
            } else {
              // Modern Impact: sidebar layout
              return (
                <div
                  className="template-card__preview"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                    borderRadius: "4px",
                    height: "120px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  <div style={{ marginRight: "8px" }}>🚀</div>
                  Modern
                </div>
              );
            }
          };

          return (
            <div
              key={theme.id}
              className={`template-card-wrapper ${
                isSelected ? "template-card-wrapper--selected" : ""
              }`}
              onMouseEnter={() => setHoveredTheme(theme.id)}
              onMouseLeave={() => setHoveredTheme(null)}
            >
              <button
                type="button"
                className={`template-card ${
                  isSelected ? "template-card--selected" : ""
                } ${hoveredTheme === theme.id ? "template-card--hovered" : ""}`}
                onClick={() => onSelectTheme(theme.id)}
              >
                {renderPreview()}
                <div className="template-card__info">
                  <div className="template-card__name">
                    {theme.name || theme.id}
                  </div>
                  {theme.description && (
                    <div className="template-card__description muted small">
                      {theme.description}
                    </div>
                  )}
                </div>
                {isSelected && (
                  <div className="template-card__badge">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M13.5 4L6 11.5L2.5 8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </button>
              {hoveredTheme === theme.id && theme.description && (
                <div className="template-card__tooltip">
                  {theme.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
