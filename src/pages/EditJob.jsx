import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { JobService, LocationService } from "../lib/api.js";
import { companyApi } from "../services/companyApi";
import { jobsApi } from "../services/jobsApi";
import { useJobUpdate, useSkills, useCategories } from "../hooks/useJobs";
import {
  Button,
  Card,
  CardBody,
  Badge,
  Input,
  Textarea,
  Select,
  Modal,
  JobFormSkeleton,
} from "../components/shared";
import {
  JobFormGrid,
  JobFormSection,
  JobFormColumn,
} from "../components/JobFormGrid";
import { FieldCard, FieldGroup, FieldRow } from "../components/FieldCard";
import { InlineListEditor } from "../components/InlineListEditor";
import { SearchableSelect } from "../components/SearchableSelect";
import { QuickActionsBar } from "../components/QuickActionsBar";
import {
  PreviewModalWrapper,
  PreviewSection,
  PreviewItem,
} from "../components/PreviewModalWrapper";
// Progress stepper presentational removed (we keep only overall progress bar)
import "../styles/shared.css";
import "./PostJob.css";

const JOB_TYPE_OPTIONS = [
  { value: "full_time", label: "Toàn thời gian" },
  { value: "part_time", label: "Bán thời gian" },
  { value: "contract", label: "Hợp đồng" },
];

const REQUIREMENT_TYPE_OPTIONS = [
  { value: "education", label: "Học vấn" },
  { value: "experience", label: "Kinh nghiệm" },
  { value: "skill", label: "Kỹ năng" },
  { value: "certification", label: "Chứng chỉ" },
  { value: "language", label: "Ngoại ngữ" },
  { value: "other", label: "Khác" },
];

const BENEFIT_TYPE_OPTIONS = [
  { value: "salary", label: "Lương thưởng" },
  { value: "insurance", label: "Bảo hiểm" },
  { value: "bonus", label: "Thưởng" },
  { value: "training", label: "Đào tạo" },
  { value: "vacation", label: "Nghỉ phép" },
  { value: "equipment", label: "Trang thiết bị" },
  { value: "other", label: "Khác" },
];

const SHIFT_TYPE_OPTIONS = [
  { value: "morning", label: "Ca sáng" },
  { value: "afternoon", label: "Ca chiều" },
  { value: "night", label: "Ca đêm" },
  { value: "flexible", label: "Linh hoạt" },
];

export default function EditJob() {
  console.log("EditJob component rendered");
  const navigate = useNavigate();
  const { jobId } = useParams();

  const [jobData, setJobData] = useState(null);
  const [jobLoading, setJobLoading] = useState(true);

  // Form state
  const [activeTab, setActiveTab] = useState("basic");
  const [showPreview, setShowPreview] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Modal states for adding items
  const [showAddRequirementModal, setShowAddRequirementModal] = useState(false);
  const [showAddBenefitModal, setShowAddBenefitModal] = useState(false);
  const [showAddSkillsModal, setShowAddSkillsModal] = useState(false);
  // Modal form states
  const [modalReqForm, setModalReqForm] = useState({
    requirement_type: "",
    title: "",
    description: "",
    is_required: true,
    level: "",
    years_experience: "",
  });
  const [modalBenForm, setModalBenForm] = useState({
    benefit_type: "",
    title: "",
    description: "",
    value_amount: "",
    value_currency: "VND",
  });
  const [modalSkillsForm, setModalSkillsForm] = useState({
    category: "",
    skills: [],
  });

  // Loading states for actions
  const [actionLoading, setActionLoading] = useState({
    addingRequirement: false,
    addingBenefit: false,
    addingSkill: false,
  });

  // Company data
  const [company, setCompany] = useState(null);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [error, setError] = useState(null);

  // Job update hook
  const {
    updateJob,
    loading: submitting,
    error: submitError,
    success,
  } = useJobUpdate(jobId);

  // Skills and categories hooks
  const { categories: skillCategories, loading: categoriesLoading } =
    useCategories("technical");

  // For backward compatibility, set loading states
  const [loadingSkills, setLoadingSkills] = useState(false);

  // Dropdown data (tags removed - DB no longer has tags)

  // Initialize empty arrays for categories and skills
  const [initialCategories, setInitialCategories] = useState([]);
  const [initialSkills, setInitialSkills] = useState([]);

  // Skill category cascading dropdown states
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [selectedSkillsData, setSelectedSkillsData] = useState([]); // Store full skill objects
  const [skillSearch, setSkillSearch] = useState("");
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);

  // Skills hook: only fetch when category is selected
  const { skills: availableSkills, loading: skillsLoading } = useSkills(
    skillSearch,
    selectedCategory?.id || "",
    500
  );

  // When server returns skills for selected category, cache them as initialSkills
  useEffect(() => {
    // update loading flag and cache skills when category present
    setLoadingSkills(skillsLoading || categoriesLoading);
    if (selectedCategory) {
      setInitialSkills(availableSkills || []);
    }
  }, [availableSkills, selectedCategory]);

  // Location cascading dropdown states
  const [provinces, setProvinces] = useState([]);
  const [initialProvinces, setInitialProvinces] = useState([]); // Store all provinces for search
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [provinceSearch, setProvinceSearch] = useState("");
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);

  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [initialDistricts, setInitialDistricts] = useState([]); // Store all districts for search
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [districtSearch, setDistrictSearch] = useState("");
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);

  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [isLoadingLocationHierarchy, setIsLoadingLocationHierarchy] =
    useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    company_id: "",
    location_id: "",
    salary_min: "",
    salary_max: "",
    currency: "VND",
    job_type: "full_time",
    experience_level: "",
    expires_at: "",
    requirements: [],
    benefits: [],
    skill_ids: [],
    work_arrangements: {
      is_remote_allowed: false,
      remote_percentage: 0,
      flexible_hours: false,
      travel_requirement: "",
      overtime_expected: false,
      shift_type: "",
    },
  });

  // Progress stepper steps
  const steps = [
    { title: "Thông tin cơ bản", description: "Tiêu đề, mô tả, công ty" },
    { title: "Yêu cầu", description: "Yêu cầu công việc" },
    { title: "Phúc lợi", description: "Phúc lợi và đãi ngộ" },
    { title: "Kỹ năng", description: "Kỹ năng" },
    { title: "Điều kiện", description: "Điều kiện làm việc" },
  ];

  const getCurrentStep = () => {
    const tabOrder = ["basic", "requirements", "benefits", "skills", "work"];
    return tabOrder.indexOf(activeTab);
  };

  // Load job data on mount
  useEffect(() => {
    const loadJobData = async () => {
      if (!jobId) {
        setError("Không tìm thấy ID công việc");
        setJobLoading(false);
        return;
      }

      try {
        setJobLoading(true);
        const j = await jobsApi.getJobForManage(jobId);
        if (j) {
          // Normalize job data first (same logic as useJobManage hook)
          const normalizeJobForEdit = (job) => {
            if (!job) return job;
            const copy = { ...job };

            try {
              // Normalize skills
              if (Array.isArray(copy.job_skills)) {
                copy.skill_ids = copy.job_skills.map((js) => js.skill_id);
                copy.skills = copy.job_skills
                  .map((js) => js.skills)
                  .filter(Boolean);
              }

              // Normalize requirements
              if (Array.isArray(copy.job_requirements)) {
                copy.requirements = copy.job_requirements;
              }

              // Normalize benefits
              if (Array.isArray(copy.job_benefits)) {
                copy.benefits = copy.job_benefits;
              }

              // Normalize work arrangements
              if (
                copy.job_work_arrangements &&
                typeof copy.job_work_arrangements === "object"
              ) {
                copy.work_arrangements = copy.job_work_arrangements;
              }
            } catch (e) {
              console.warn("Failed to normalize job object for edit", e);
            }

            return copy;
          };

          const normalizedJob = normalizeJobForEdit(j);
          setJobData(normalizedJob);

          // Map fields from normalized job to form shape
          setForm((prev) => ({
            ...prev,
            title: normalizedJob.title || "",
            description: normalizedJob.description || "",
            company_id:
              normalizedJob.company_id ||
              normalizedJob.companies?.id ||
              prev.company_id,
            location_id:
              normalizedJob.location_id ||
              normalizedJob.location?.id ||
              normalizedJob.location_text ||
              prev.location_id,
            salary_min: normalizedJob.salary_range?.min || "",
            salary_max: normalizedJob.salary_range?.max || "",
            currency: normalizedJob.salary_range?.currency || "VND",
            job_type: normalizedJob.job_type || "full_time",
            experience_level: normalizedJob.experience_level || "",
            expires_at: normalizedJob.expires_at
              ? new Date(normalizedJob.expires_at).toISOString().slice(0, 16)
              : "",
            requirements: normalizedJob.requirements || prev.requirements,
            benefits: normalizedJob.benefits || prev.benefits,
            skill_ids: normalizedJob.skill_ids || prev.skill_ids,
            work_arrangements:
              normalizedJob.work_arrangements || prev.work_arrangements,
          }));

          // Set selectedSkillsData for preview from normalized skills
          if (
            Array.isArray(normalizedJob.skills) &&
            normalizedJob.skills.length > 0
          ) {
            setSelectedSkillsData(normalizedJob.skills);
          }

          // Set company if present
          if (normalizedJob.companies) {
            setCompany(normalizedJob.companies);
          }
        } else {
          setError("Không tìm thấy công việc");
        }
      } catch (err) {
        console.error("Failed to load job for edit:", err);
        setError(err?.message || "Không thể tải thông tin công việc");
      } finally {
        setJobLoading(false);
      }
    };

    loadJobData();
  }, [jobId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escape để đóng modal
      if (e.key === "Escape") {
        setShowAddRequirementModal(false);
        setShowAddBenefitModal(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // -----------------------------
  // Inline / per-field validation
  // -----------------------------
  const validateSingleField = useCallback(
    (name, value) => {
      // Return error message string or null
      switch (name) {
        case "title": {
          if (!value || String(value).trim().length < 10)
            return "Tiêu đề phải có ít nhất 10 ký tự";
          if (String(value).trim().length > 255)
            return "Tiêu đề tối đa 255 ký tự";
          return null;
        }
        case "description": {
          if (!value || String(value).trim().length < 50)
            return "Mô tả phải có ít nhất 50 ký tự";
          return null;
        }
        case "salary_min":
        case "salary_max": {
          const min = form.salary_min
            ? parseInt(String(form.salary_min), 10)
            : NaN;
          const max = form.salary_max
            ? parseInt(String(form.salary_max), 10)
            : NaN;
          if (!isNaN(min) && !isNaN(max) && min > max)
            return "Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu";
          return null;
        }
        case "expires_at": {
          if (!value) return null;
          const d = new Date(value);
          if (isNaN(d.getTime())) return "Ngày không hợp lệ";
          if (d <= new Date()) return "Ngày hết hạn phải trong tương lai";
          return null;
        }
        case "company_id": {
          if (!value) return "Vui lòng chọn công ty";
          // basic UUID check
          const uuidRe =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (!uuidRe.test(String(value))) return "Company ID không hợp lệ";
          return null;
        }
        case "location_id": {
          if (!value) return null;
          const uuidRe =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (!uuidRe.test(String(value))) return "Location ID không hợp lệ";
          return null;
        }
        default:
          return null;
      }
    },
    [form.salary_min, form.salary_max, form]
  );

  const focusFirstError = useCallback(() => {
    // Try to focus first element with class 'error' or with name equal to error key
    const el =
      document.querySelector(".error") ||
      document.querySelector('[name="' + Object.keys(fieldErrors)[0] + '"]');
    if (el && typeof el.focus === "function") el.focus();
  }, [fieldErrors]);

  const handleFieldBlur = useCallback(
    (name, value) => {
      const msg = validateSingleField(name, value);
      setFieldErrors((prev) => {
        const copy = { ...prev };
        if (msg) copy[name] = msg;
        else delete copy[name];
        return copy;
      });
      if (msg) {
        // show top-level error message too
        setError(msg);
      } else {
        setError(null);
      }
    },
    [validateSingleField]
  );

  // Load company on mount
  useEffect(() => {
    let mounted = true;
    let timeoutId = null;
    let fetchCompleted = false;

    const fetchCompany = async () => {
      try {
        console.log("Fetching company data...");
        const companyData = await companyApi.getMyCompany();
        console.log("Company data received:", companyData);

        fetchCompleted = true;

        // Clear timeout if data is received successfully
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (!mounted) return;
        console.log("Company verification status:", companyData?.is_verified);
        setCompany(companyData);
        setForm((prev) => ({ ...prev, company_id: companyData?.id || "" }));
        setCompanyLoading(false);
        setError(null); // Clear any previous errors

        // FAKE: Bỏ qua check verified - cho phép đăng tin không cần verify
        // // Check if company is verified
        // if (companyData && companyData.is_verified === false) {
        //   setError('Công ty của bạn chưa được xác minh. Vui lòng liên hệ quản trị viên để xác minh công ty trước khi đăng tin tuyển dụng.')
        // } else if (companyData && companyData.is_verified === true) {
        //   console.log('Company is verified, can post jobs')
        // }
      } catch (err) {
        console.error("Failed to fetch company:", err);

        fetchCompleted = true;

        // Clear timeout on error
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (!mounted) return;
        setLoading(false);
        if (err?.status === 404) {
          setError("Bạn chưa có công ty. Vui lòng tạo công ty trước.");
        } else {
          setError(err?.message || "Không thể tải thông tin công ty.");
        }
      }
    };

    // Add timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      // Only show timeout error if fetch hasn't completed
      if (mounted && !fetchCompleted) {
        console.warn("Company fetch timeout, setting loading to false");
        setLoading(false);
        setError("Không thể tải thông tin công ty. Vui lòng thử lại.");
      }
    }, 10000); // 10 second timeout

    fetchCompany();

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // Skills are now handled by useSkills hook

  // Skills search is now handled by useSkills hook

  // Tags removed (DB no longer contains tags)

  // Load provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await LocationService.getProvinces();
        const data = response.data || [];
        setProvinces(data);
        setInitialProvinces(data); // Store for search filtering
      } catch (err) {
        console.error("Failed to fetch provinces:", err);
      }
    };
    fetchProvinces();
  }, []);

  // Debounced search for provinces
  useEffect(() => {
    if (!provinceSearch.trim()) {
      // When search is empty, show all provinces
      setProvinces(initialProvinces);
      return;
    }

    // Filter provinces client-side by name
    const filtered = initialProvinces.filter((province) =>
      province.name.toLowerCase().includes(provinceSearch.toLowerCase())
    );
    setProvinces(filtered);
  }, [provinceSearch, initialProvinces]);

  // Debounced search for districts
  useEffect(() => {
    if (!districtSearch.trim()) {
      // When search is empty, show all districts
      setAvailableDistricts(initialDistricts);
      return;
    }

    // Filter districts client-side by name
    const filtered = initialDistricts.filter((district) =>
      district.name.toLowerCase().includes(districtSearch.toLowerCase())
    );
    setAvailableDistricts(filtered);
  }, [districtSearch, initialDistricts]);

  // Fetch districts when province is selected
  useEffect(() => {
    if (!selectedProvince) {
      setAvailableDistricts([]);
      setInitialDistricts([]);
      setDistrictSearch("");
      // Only reset district if not loading location hierarchy
      if (!isLoadingLocationHierarchy) {
        setSelectedDistrict(null);
      }
      return;
    }

    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const response = await LocationService.getDistricts(
          selectedProvince.id
        );
        const data = response.data || [];
        setAvailableDistricts(data);
        setInitialDistricts(data); // Store for search filtering

        // Reset district selection when province changes, but not if loading hierarchy
        if (!isLoadingLocationHierarchy) {
          setSelectedDistrict(null);
          setDistrictSearch("");
          setForm((prev) => ({ ...prev, location_id: "" }));
        }
      } catch (err) {
        console.error("Failed to fetch districts:", err);
        setAvailableDistricts([]);
        setInitialDistricts([]);
      } finally {
        setLoadingDistricts(false);
      }
    };

    fetchDistricts();
  }, [selectedProvince, isLoadingLocationHierarchy]);

  // Handle existing location_id when editing (if location_id exists in form)
  useEffect(() => {
    const loadLocationHierarchy = async () => {
      if (!form.location_id || form.location_id.trim() === "") {
        return;
      }

      // Skip if already loaded
      if (
        selectedProvince &&
        selectedDistrict &&
        selectedDistrict.id === form.location_id
      ) {
        return;
      }

      setIsLoadingLocationHierarchy(true);
      try {
        // Get the location by ID
        const locationResponse = await LocationService.getById(
          form.location_id
        );
        const location = locationResponse.data;

        if (!location) {
          setIsLoadingLocationHierarchy(false);
          return;
        }

        // If location has parent_id, it's a district - need to load province
        if (location.parent_id) {
          // Get the parent (province)
          const provinceResponse = await LocationService.getById(
            location.parent_id
          );
          const province = provinceResponse.data;

          if (province) {
            setSelectedProvince(province);
            setProvinceSearch(province.name);
            // Districts will be loaded by the useEffect above

            // Wait for districts to load, then set the selected district
            setTimeout(async () => {
              try {
                const districtsResponse = await LocationService.getDistricts(
                  province.id
                );
                const districts = districtsResponse.data || [];
                setAvailableDistricts(districts);
                setInitialDistricts(districts);

                const district = districts.find(
                  (d) => d.id === form.location_id
                );
                if (district) {
                  setSelectedDistrict(district);
                  setDistrictSearch(district.name);
                }
              } finally {
                setIsLoadingLocationHierarchy(false);
              }
            }, 300);
          } else {
            setIsLoadingLocationHierarchy(false);
          }
        } else {
          // If no parent_id, it's a province itself
          setSelectedProvince(location);
          setProvinceSearch(location.name);
          setIsLoadingLocationHierarchy(false);
        }
      } catch (err) {
        console.error("Failed to load location hierarchy:", err);
        setIsLoadingLocationHierarchy(false);
      }
    };

    loadLocationHierarchy();
  }, [form.location_id]); // Run when location_id changes

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("work_arrangements.")) {
      const field = name.replace("work_arrangements.", "");
      setForm((prev) => ({
        ...prev,
        work_arrangements: {
          ...prev.work_arrangements,
          [field]: type === "checkbox" ? checked : value,
        },
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle province selection
  const handleProvinceSelect = (province) => {
    setSelectedProvince(province);
    setProvinceSearch(province.name);
    setShowProvinceDropdown(false);
    // Districts will be loaded by useEffect
  };

  // Handle district selection
  const handleDistrictSelect = (district) => {
    setSelectedDistrict(district);
    setDistrictSearch(district.name);
    setShowDistrictDropdown(false);
    setForm((prev) => ({ ...prev, location_id: district.id }));
  };

  // Clear province selection
  const handleClearProvince = () => {
    setSelectedProvince(null);
    setProvinceSearch("");
    setAvailableDistricts([]);
    setInitialDistricts([]);
    setSelectedDistrict(null);
    setDistrictSearch("");
    setForm((prev) => ({ ...prev, location_id: "" }));
  };

  // Clear district selection
  const handleClearDistrict = () => {
    setSelectedDistrict(null);
    setDistrictSearch("");
    setForm((prev) => ({ ...prev, location_id: "" }));
  };

  // Requirements handlers
  const addRequirement = (newReq = null) => {
    if (newReq) {
      // Add with provided data (from modal or quick add)
      setForm((prev) => ({
        ...prev,
        requirements: [...prev.requirements, newReq],
      }));
    } else {
      // Add empty item (legacy behavior)
      setForm((prev) => ({
        ...prev,
        requirements: [
          ...prev.requirements,
          {
            requirement_type: "",
            title: "",
            description: "",
            is_required: true,
            level: "",
            years_experience: "",
          },
        ],
      }));
    }
  };

  const handleModalAddReq = (newReq) => {
    addRequirement(newReq);
    setShowAddRequirementModal(false);
  };

  const removeRequirement = (index) => {
    setForm((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  const updateRequirement = (index, field, value) => {
    setForm((prev) => {
      const newRequirements = [...prev.requirements];
      newRequirements[index] = { ...newRequirements[index], [field]: value };
      return { ...prev, requirements: newRequirements };
    });
  };

  // Benefits handlers
  const addBenefit = (newBen = null) => {
    if (newBen) {
      // Add with provided data (from modal)
      setForm((prev) => ({
        ...prev,
        benefits: [...prev.benefits, newBen],
      }));
    } else {
      // Add empty item (legacy behavior)
      setForm((prev) => ({
        ...prev,
        benefits: [
          ...prev.benefits,
          {
            benefit_type: "",
            title: "",
            description: "",
            value_amount: "",
            value_currency: "VND",
          },
        ],
      }));
    }
  };

  const handleModalAddBen = (newBen) => {
    addBenefit(newBen);
    setShowAddBenefitModal(false);
  };

  const removeBenefit = (index) => {
    setForm((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  };

  const updateBenefit = (index, field, value) => {
    setForm((prev) => {
      const newBenefits = [...prev.benefits];
      newBenefits[index] = { ...newBenefits[index], [field]: value };
      return { ...prev, benefits: newBenefits };
    });
  };

  // Category handlers
  const handleCategorySelect = (category) => {
    // Set the active category for filtering available skills but DO NOT clear
    // already-selected skills. Users should be able to add skills across
    // multiple categories without losing previous selections.
    setSelectedCategory(category);
    setCategorySearch(category?.name || category);
    setShowCategoryDropdown(false);
  };

  const handleClearCategory = () => {
    // Clear active category filter but keep already-selected skills intact.
    setSelectedCategory(null);
    setCategorySearch("");
    setAvailableSkills([]);
    setInitialSkills([]);
    // Do not clear selectedSkillsData or form.skill_ids here so skills from
    // other categories remain in the job.
    setSkillSearch("");
  };

  // Skills handlers
  const addSkill = (skill) => {
    if (!form.skill_ids.includes(skill.id)) {
      setForm((prev) => ({
        ...prev,
        skill_ids: [...prev.skill_ids, skill.id],
      }));
      setSelectedSkillsData((prev) => [...prev, skill]);
    }
    setSkillSearch("");
    setShowSkillDropdown(false);
  };

  const removeSkill = (skillId) => {
    setForm((prev) => ({
      ...prev,
      skill_ids: prev.skill_ids.filter((id) => id !== skillId),
    }));
    setSelectedSkillsData((prev) => prev.filter((s) => s.id !== skillId));
  };

  // Custom skill handler
  const addCustomSkill = async (skillName) => {
    if (!skillName.trim() || !selectedCategory) return;

    setActionLoading((prev) => ({ ...prev, addingSkill: true }));
    try {
      // For now, create a temporary skill object
      // In real implementation, this would call an API to create the skill
      const customSkill = {
        id: `custom_${Date.now()}`,
        name: skillName.trim(),
        category: selectedCategory,
        is_custom: true,
      };

      addSkill(customSkill);
    } finally {
      setActionLoading((prev) => ({ ...prev, addingSkill: false }));
    }
  };

  // Keep selectedSkillsData in sync with form.skill_ids (single source of truth)
  useEffect(() => {
    const ids = form.skill_ids || [];
    if (!ids || ids.length === 0) {
      setSelectedSkillsData([]);
      return;
    }

    setSelectedSkillsData((prev) => {
      // Build a map of existing by id for fast lookup
      const existingById = new Map((prev || []).map((s) => [String(s.id), s]));

      const resolved = ids.map((id) => {
        const idStr = String(id);
        if (existingById.has(idStr)) return existingById.get(idStr);
        // try to resolve from available or cached initial skills
        const fromAvail =
          (availableSkills || []).find((s) => String(s.id) === idStr) ||
          (initialSkills || []).find((s) => String(s.id) === idStr);
        if (fromAvail) return fromAvail;
        // fallback placeholder (will be replaced when data available)
        return {
          id: idStr,
          name: idStr,
          category: selectedCategory || null,
          is_custom: true,
        };
      });

      return resolved;
    });
  }, [form.skill_ids, availableSkills, initialSkills, selectedCategory]);

  // Expose debug handles to window for easier inspection in DevTools
  useEffect(() => {
    try {
      // eslint-disable-next-line no-undef
      window.__debug_editjob_form = form;
      // eslint-disable-next-line no-undef
      window.__debug_editjob_jobData = jobData;
      // eslint-disable-next-line no-undef
      window.__debug_selectedSkillsData = selectedSkillsData;
    } catch (e) {
      // ignore in non-browser env
    }
  }, [form, jobData, selectedSkillsData]);

  // Log when form.skill_ids changes to help debug lost items
  useEffect(() => {
    console.debug("EditJob: form.skill_ids changed:", form.skill_ids);
  }, [form.skill_ids]);

  // Expose submit-related state for debugging (modals / submitting)
  useEffect(() => {
    try {
      // eslint-disable-next-line no-undef
      window.__debug_editjob_state = {
        submitting,
        showAddRequirementModal,
        showAddBenefitModal,
        showAddSkillsModal,
        showPreview,
      };
    } catch (e) {
      // ignore
    }
  }, [
    submitting,
    showAddRequirementModal,
    showAddBenefitModal,
    showAddSkillsModal,
    showPreview,
  ]);

  // tags removed from frontend (DB no longer has tags)

  // Validation
  const validateForm = () => {
    const errors = {};

    if (!form.title || form.title.trim().length < 10) {
      errors.title = "Tiêu đề phải có ít nhất 10 ký tự";
    }
    if (!form.description || form.description.trim().length < 50) {
      errors.description = "Mô tả phải có ít nhất 50 ký tự";
    }
    if (!form.company_id) {
      errors.company_id = "Vui lòng chọn công ty";
    }

    // Location validation - require both province and district if location is selected
    if (form.location_id && form.location_id.trim() !== "") {
      if (!selectedProvince) {
        errors.province = "Vui lòng chọn tỉnh/thành phố";
      }
      if (!selectedDistrict) {
        errors.district = "Vui lòng chọn quận/huyện/xã";
      }
    }

    // Salary validation
    if (form.salary_min && form.salary_max) {
      const min = parseInt(form.salary_min, 10);
      const max = parseInt(form.salary_max, 10);
      if (!isNaN(min) && !isNaN(max) && min > max) {
        errors.salary = "Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu";
      }
    }

    // Requirements validation
    form.requirements.forEach((req, index) => {
      if (req.title?.trim() && !req.requirement_type) {
        errors[`requirements.${index}.requirement_type`] =
          "Vui lòng chọn loại yêu cầu";
      }
      if (req.requirement_type && !req.title?.trim()) {
        errors[`requirements.${index}.title`] =
          "Tiêu đề yêu cầu không được để trống";
      }
    });

    // Benefits validation
    form.benefits.forEach((ben, index) => {
      if (ben.title?.trim() && !ben.benefit_type) {
        errors[`benefits.${index}.benefit_type`] =
          "Vui lòng chọn loại phúc lợi";
      }
      if (ben.benefit_type && !ben.title?.trim()) {
        errors[`benefits.${index}.title`] =
          "Tiêu đề phúc lợi không được để trống";
      }
    });

    // Remote percentage validation
    if (form.work_arrangements.is_remote_allowed) {
      const percentage = parseInt(form.work_arrangements.remote_percentage, 10);
      if (isNaN(percentage) || percentage < 0 || percentage > 100) {
        errors.remote_percentage = "Phần trăm làm việc từ xa phải từ 0-100";
      }
    }

    return errors;
  };

  // Publish job to pending_approval
  const handlePublishJob = async () => {
    if (!jobId) return;

    try {
      setError(null);
      await jobsApi.publishJobs({ job_ids: [jobId] });
      alert("Đã gửi tin tuyển dụng để admin duyệt!");
      navigate("/recruiter/jobs");
    } catch (err) {
      console.error("Failed to publish job:", err);
      setError(err?.message || "Không thể gửi duyệt tin tuyển dụng");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Vui lòng kiểm tra lại các trường đã nhập.");
      return;
    }

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        location_id: form.location_id || null,
        salary_range:
          form.salary_min && form.salary_max
            ? {
                min: parseInt(form.salary_min, 10),
                max: parseInt(form.salary_max, 10),
                currency: form.currency || "VND",
              }
            : undefined,
        job_type: form.job_type,
        experience_level: form.experience_level
          ? parseInt(form.experience_level, 10)
          : null,
        expires_at: form.expires_at
          ? new Date(form.expires_at).toISOString()
          : undefined,
        requirements:
          form.requirements.filter(
            (req) => req.title?.trim() && req.requirement_type
          ).length > 0
            ? form.requirements
                .filter((req) => req.title?.trim() && req.requirement_type)
                .map((req) => ({
                  requirement_type: req.requirement_type,
                  title: req.title.trim(),
                  description: req.description?.trim() || undefined,
                  is_required: req.is_required !== false,
                  level: req.level?.trim() || undefined,
                  years_experience: req.years_experience
                    ? parseInt(req.years_experience, 10)
                    : undefined,
                }))
            : undefined,
        benefits:
          form.benefits.filter((ben) => ben.title?.trim() && ben.benefit_type)
            .length > 0
            ? form.benefits
                .filter((ben) => ben.title?.trim() && ben.benefit_type)
                .map((ben) => ({
                  benefit_type: ben.benefit_type,
                  title: ben.title.trim(),
                  description: ben.description?.trim() || undefined,
                  value_amount: ben.value_amount
                    ? isNaN(Number(ben.value_amount))
                      ? undefined
                      : Number(ben.value_amount)
                    : undefined,
                  value_currency: ben.value_currency || "VND",
                }))
            : undefined,
        skill_ids: form.skill_ids.length > 0 ? form.skill_ids : undefined,
        work_arrangements:
          form.work_arrangements.is_remote_allowed ||
          form.work_arrangements.flexible_hours ||
          form.work_arrangements.travel_requirement?.trim() ||
          form.work_arrangements.overtime_expected ||
          form.work_arrangements.shift_type
            ? {
                is_remote_allowed:
                  form.work_arrangements.is_remote_allowed || false,
                remote_percentage: form.work_arrangements.is_remote_allowed
                  ? parseInt(form.work_arrangements.remote_percentage, 10) || 0
                  : 0,
                flexible_hours: form.work_arrangements.flexible_hours || false,
                travel_requirement:
                  form.work_arrangements.travel_requirement?.trim() ||
                  undefined,
                overtime_expected:
                  form.work_arrangements.overtime_expected || false,
                shift_type: form.work_arrangements.shift_type || undefined,
              }
            : undefined,
      };

      await updateJob(payload);
      alert("Đã cập nhật tin tuyển dụng thành công!");
      navigate("/recruiter/jobs");
    } catch (err) {
      console.error("Failed to update job:", err);
      // Log server response body if available for easier debugging
      console.error("Update job error data:", err?.data ?? err);
      if (err?.data?.errors) {
        const errorMap = {};
        err.data.errors.forEach((e) => {
          errorMap[e.path] = e.message;
        });
        setFieldErrors(errorMap);
        setError(err.data.message || "Validation error");
        // focus first invalid field to improve UX
        setTimeout(() => {
          focusFirstError();
        }, 50);
      } else if (err?.data?.message) {
        setError(err.data.message);
      } else {
        setError(
          err?.message || "Không thể cập nhật tin tuyển dụng. Vui lòng thử lại."
        );
      }
    }
  };

  // Get action buttons based on job status
  const getActionButtons = () => {
    const currentStatus = jobData?.status;

    // If job is draft, show "Lưu thay đổi" and "Gửi duyệt"
    if (currentStatus === "draft") {
      return (
        <>
          <Button
            variant="outline"
            onClick={handlePublishJob}
            disabled={submitting}
          >
            Gửi duyệt
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            loading={submitting}
          >
            {submitting ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </>
      );
    }

    // For approved or other statuses, only show "Lưu thay đổi"
    return (
      <Button
        type="submit"
        variant="primary"
        disabled={submitting}
        loading={submitting}
      >
        {submitting ? "Đang lưu..." : "Lưu thay đổi"}
      </Button>
    );
  };

  if (jobLoading || companyLoading) {
    return (
      <div className="section">
        <JobFormSkeleton />
      </div>
    );
  }

  if (error && !jobData) {
    return (
      <div className="section">
        <div
          className="card"
          style={{
            padding: "20px",
            background: "#fee",
            border: "1px solid #fcc",
          }}
        >
          <p style={{ color: "#c00", margin: 0 }}>{error}</p>
          <button
            className="btn primary"
            onClick={() => navigate("/recruiter/jobs")}
            style={{ marginTop: "12px" }}
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  // Calculate form completion percentage
  const calculateCompletion = () => {
    let completed = 0;
    let total = 0;

    // Basic info
    total += 3;
    if (form.title && form.title.length >= 10) completed++;
    if (form.description && form.description.length >= 50) completed++;
    if (form.company_id) completed++;

    // Requirements
    if (form.requirements.length > 0) {
      total++;
      const validReqs = form.requirements.filter(
        (r) => r.title?.trim() && r.requirement_type
      );
      if (validReqs.length > 0) completed++;
    }

    // Benefits
    if (form.benefits.length > 0) {
      total++;
      const validBenefits = form.benefits.filter(
        (b) => b.title?.trim() && b.benefit_type
      );
      if (validBenefits.length > 0) completed++;
    }

    // Skills
    total++;
    if (form.skill_ids.length > 0) completed++;

    // Work arrangements (optional)

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const completionPercentage = calculateCompletion();

  return (
    <div className="section edit-job-page">
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb-nav">
        <Button
          variant="ghost"
          size="small"
          onClick={() => navigate("/recruiter/jobs")}
          className="back-btn"
        >
          ← Quay lại danh sách tin tuyển dụng
        </Button>
      </div>

      {/* Header with Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Chỉnh sửa tin tuyển dụng
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Cập nhật thông tin chi tiết về vị trí công việc
              </p>
            </div>
            <Badge
              variant={
                jobData?.status === "approved"
                  ? "success"
                  : jobData?.status === "draft"
                  ? "default"
                  : "warning"
              }
            >
              {jobData?.status === "approved"
                ? "Đã duyệt"
                : jobData?.status === "draft"
                ? "Nháp"
                : "Chờ duyệt"}
            </Badge>
          </div>
        </div>

        <QuickActionsBar
          actions={[
            {
              label: "Xem trước",
              icon: "👁️",
              onClick: () => setShowPreview(true),
              variant: "outline",
            },
          ]}
        />
      </div>

      <JobFormGrid>
        <JobFormColumn>
          {/* Progress Section */}
          <FieldCard
            title={`Tiến độ hoàn thành: ${completionPercentage}%`}
            className="mb-6"
          >
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </FieldCard>

          {error && (
            <Card className="error-card" padding="medium">
              <p
                style={{
                  color: "#dc2626",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>⚠️</span>
                {error}
              </p>
            </Card>
          )}

          {/* Tabs Navigation */}
          <FieldCard className="mb-6">
            <nav
              role="tablist"
              className="flex space-x-1 p-1 bg-gray-100 rounded-lg"
              aria-label="Job editing form sections"
            >
              {[
                { id: "basic", label: "Thông tin cơ bản", icon: "📄" },
                { id: "requirements", label: "Yêu cầu công việc", icon: "✅" },
                { id: "benefits", label: "Phúc lợi", icon: "🎁" },
                { id: "skills", label: "Kỹ năng", icon: "🛠️" },
                { id: "work", label: "Điều kiện làm việc", icon: "⚙️" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`tabpanel-${tab.id}`}
                  id={`tab-${tab.id}`}
                  className={`
                    flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${
                      activeTab === tab.id
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }
                  `}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </FieldCard>
        </JobFormColumn>

        <JobFormColumn>
          {/* Main Content Area */}
          <JobFormSection>
            <form className="card" onSubmit={onSubmit}>
              {/* Tab: Basic Info */}
              {activeTab === "basic" && (
                <>
                  <div
                    role="tabpanel"
                    id="tabpanel-basic"
                    aria-labelledby="tab-basic"
                  >
                    <FieldCard
                      title="Thông tin cơ bản"
                      subtitle="Thông tin chính về vị trí công việc"
                      icon={<span className="text-xl">📄</span>}
                    >
                      <FieldRow>
                        <div className="space-y-4">
                          <label className="block">
                            <span className="block text-sm font-medium text-gray-700 mb-2">
                              Tiêu đề <span className="text-red-500">*</span>
                            </span>
                            <input
                              name="title"
                              value={form.title}
                              onChange={onChange}
                              onBlur={(e) =>
                                handleFieldBlur("title", e.target.value)
                              }
                              placeholder="VD: Frontend Engineer"
                              required
                              minLength={10}
                              maxLength={255}
                              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                fieldErrors.title
                                  ? "border-red-300"
                                  : "border-gray-300"
                              }`}
                            />
                            <div className="flex justify-between items-center mt-1">
                              {fieldErrors.title ? (
                                <small className="text-red-600">
                                  {fieldErrors.title}
                                </small>
                              ) : (
                                <small className="text-gray-500">
                                  Tối thiểu 10 ký tự, tối đa 255 ký tự
                                </small>
                              )}
                              <small className="text-gray-500">
                                {form.title.length}/255
                              </small>
                            </div>
                          </label>

                          <label className="block">
                            <span className="block text-sm font-medium text-gray-700 mb-2">
                              Mô tả <span className="text-red-500">*</span>
                            </span>
                            <textarea
                              name="description"
                              value={form.description}
                              onChange={onChange}
                              onBlur={(e) =>
                                handleFieldBlur("description", e.target.value)
                              }
                              placeholder="Mô tả chi tiết về vị trí công việc, yêu cầu, trách nhiệm..."
                              rows={6}
                              required
                              minLength={50}
                              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                fieldErrors.description
                                  ? "border-red-300"
                                  : "border-gray-300"
                              }`}
                            />
                            <div className="flex justify-between items-center mt-1">
                              {fieldErrors.description ? (
                                <small className="text-red-600">
                                  {fieldErrors.description}
                                </small>
                              ) : (
                                <small className="text-gray-500">
                                  Tối thiểu 50 ký tự
                                </small>
                              )}
                              <small className="text-gray-500">
                                {form.description.length} ký tự
                              </small>
                            </div>
                          </label>
                        </div>

                        <div className="space-y-4">
                          <label className="block">
                            <span className="block text-sm font-medium text-gray-700 mb-2">
                              Công ty <span className="text-red-500">*</span>
                            </span>
                            <input
                              type="text"
                              value={company?.name || "Chưa có công ty"}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                            />
                            <small className="text-gray-500">
                              Công ty của bạn
                            </small>
                          </label>

                          <FieldGroup title="Địa điểm">
                            <SearchableSelect
                              options={provinces.map((p) => ({
                                value: p.id,
                                label: p.name,
                              }))}
                              value={selectedProvince?.id || ""}
                              onChange={(value) => {
                                const province = provinces.find(
                                  (p) => p.id === value
                                );
                                if (province) handleProvinceSelect(province);
                              }}
                              placeholder="Chọn tỉnh/thành phố..."
                              error={!!fieldErrors.province}
                              loading={isLoadingLocationHierarchy}
                            />
                            {fieldErrors.province && (
                              <small className="text-red-600">
                                {fieldErrors.province}
                              </small>
                            )}

                            <SearchableSelect
                              options={availableDistricts.map((d) => ({
                                value: d.id,
                                label: d.name,
                              }))}
                              value={selectedDistrict?.id || ""}
                              onChange={(value) => {
                                const district = availableDistricts.find(
                                  (d) => d.id === value
                                );
                                if (district) handleDistrictSelect(district);
                              }}
                              placeholder={
                                !selectedProvince
                                  ? "Vui lòng chọn tỉnh/thành phố trước"
                                  : "Chọn quận/huyện/xã..."
                              }
                              disabled={!selectedProvince || loadingDistricts}
                              error={!!fieldErrors.district}
                              loading={loadingDistricts}
                            />
                            {fieldErrors.district && (
                              <small className="text-red-600">
                                {fieldErrors.district}
                              </small>
                            )}
                          </FieldGroup>

                          <label className="block">
                            <span className="block text-sm font-medium text-gray-700 mb-2">
                              Loại việc <span className="text-red-500">*</span>
                            </span>
                            <select
                              name="job_type"
                              value={form.job_type}
                              onChange={onChange}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              {JOB_TYPE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      </FieldRow>
                    </FieldCard>

                    <FieldCard
                      title="Thông tin bổ sung"
                      subtitle="Chi tiết về lương và kinh nghiệm"
                      icon={<span className="text-xl">💰</span>}
                      collapsible
                    >
                      <FieldRow>
                        <FieldGroup title="Mức lương">
                          <input
                            type="number"
                            name="salary_min"
                            value={form.salary_min}
                            onChange={onChange}
                            onBlur={(e) =>
                              handleFieldBlur("salary_min", e.target.value)
                            }
                            placeholder="Lương tối thiểu"
                            min="0"
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              fieldErrors.salary
                                ? "border-red-300"
                                : "border-gray-300"
                            }`}
                          />
                          <input
                            type="number"
                            name="salary_max"
                            value={form.salary_max}
                            onChange={onChange}
                            onBlur={(e) =>
                              handleFieldBlur("salary_max", e.target.value)
                            }
                            placeholder="Lương tối đa"
                            min="0"
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              fieldErrors.salary
                                ? "border-red-300"
                                : "border-gray-300"
                            }`}
                          />
                          <select
                            name="currency"
                            value={form.currency}
                            onChange={onChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="VND">VND</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                          </select>
                        </FieldGroup>

                        <FieldGroup title="Kinh nghiệm & Thời hạn">
                          <input
                            type="number"
                            name="experience_level"
                            value={form.experience_level}
                            onChange={onChange}
                            onBlur={(e) =>
                              handleFieldBlur(
                                "experience_level",
                                e.target.value
                              )
                            }
                            placeholder="Số năm kinh nghiệm"
                            min="0"
                            max="30"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <input
                            type="datetime-local"
                            name="expires_at"
                            value={form.expires_at}
                            onChange={onChange}
                            onBlur={(e) =>
                              handleFieldBlur("expires_at", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </FieldGroup>
                      </FieldRow>
                      {fieldErrors.salary && (
                        <div className="mt-2">
                          <small className="text-red-600">
                            {fieldErrors.salary}
                          </small>
                        </div>
                      )}
                    </FieldCard>
                  </div>
                </>
              )}

              {/* Tab: Requirements */}
              {activeTab === "requirements" && (
                <div
                  role="tabpanel"
                  id="tabpanel-requirements"
                  aria-labelledby="tab-requirements"
                >
                  <FieldCard
                    title="Yêu cầu công việc"
                    subtitle="Thêm các yêu cầu cần thiết cho vị trí này"
                    icon={<span className="text-xl">✅</span>}
                  >
                    <div className="flex justify-end mb-4">
                      <Button
                        variant="primary"
                        size="small"
                        onClick={() => setShowAddRequirementModal(true)}
                        icon="+"
                        disabled={actionLoading.addingRequirement}
                      >
                        Thêm yêu cầu
                      </Button>
                    </div>

                    <InlineListEditor
                      items={form.requirements}
                      onAdd={addRequirement}
                      onUpdate={updateRequirement}
                      onRemove={removeRequirement}
                      itemType="requirement"
                      typeOptions={REQUIREMENT_TYPE_OPTIONS}
                      typeField="requirement_type"
                      titleField="title"
                      descriptionField="description"
                      additionalFields={[
                        {
                          name: "level",
                          label: "Mức độ",
                          type: "text",
                          placeholder: "VD: Trung cấp",
                        },
                        {
                          name: "years_experience",
                          label: "Số năm KN",
                          type: "number",
                          placeholder: "VD: 2",
                        },
                      ]}
                      placeholder="Thêm yêu cầu công việc..."
                      emptyMessage="Chưa có yêu cầu công việc nào."
                    />
                  </FieldCard>
                </div>
              )}

              {/* Tab: Benefits */}
              {activeTab === "benefits" && (
                <div
                  role="tabpanel"
                  id="tabpanel-benefits"
                  aria-labelledby="tab-benefits"
                >
                  <FieldCard
                    title="Phúc lợi & Đãi ngộ"
                    subtitle="Thêm các phúc lợi và đãi ngộ cho ứng viên"
                    icon={<span className="text-xl">🎁</span>}
                  >
                    <div className="flex justify-end mb-4">
                      <Button
                        variant="primary"
                        size="small"
                        onClick={() => setShowAddBenefitModal(true)}
                        icon="+"
                        disabled={actionLoading.addingBenefit}
                      >
                        Thêm phúc lợi
                      </Button>
                    </div>

                    <InlineListEditor
                      items={form.benefits}
                      onAdd={addBenefit}
                      onUpdate={updateBenefit}
                      onRemove={removeBenefit}
                      itemType="benefit"
                      typeOptions={BENEFIT_TYPE_OPTIONS}
                      typeField="benefit_type"
                      titleField="title"
                      descriptionField="description"
                      additionalFields={[
                        {
                          name: "value_amount",
                          label: "Giá trị",
                          type: "number",
                          placeholder: "VD: 1000000",
                        },
                        {
                          name: "value_currency",
                          label: "Tiền tệ",
                          type: "select",
                          options: [
                            { value: "VND", label: "VND" },
                            { value: "USD", label: "USD" },
                          ],
                        },
                      ]}
                      placeholder="Thêm phúc lợi..."
                      emptyMessage="Chưa có phúc lợi nào."
                    />
                  </FieldCard>
                </div>
              )}

              {/* Tab: Skills */}
              {activeTab === "skills" && (
                <div
                  role="tabpanel"
                  id="tabpanel-skills"
                  aria-labelledby="tab-skills"
                >
                  <FieldCard
                    title="Kỹ năng yêu cầu"
                    subtitle="Chọn các kỹ năng cần thiết cho vị trí này"
                    icon={<span className="text-xl">🛠️</span>}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <Button
                          variant="primary"
                          size="small"
                          onClick={() => {
                            setModalSkillsForm((p) => ({
                              ...p,
                              category: selectedCategory?.id || "",
                              skills: [],
                            }));
                            setShowAddSkillsModal(true);
                          }}
                        >
                          Thêm kỹ năng
                        </Button>
                      </div>
                      <Badge variant="info" size="small">
                        {selectedSkillsData.length} kỹ năng được chọn
                      </Badge>
                    </div>

                    <FieldGroup title="Danh mục kỹ năng">
                      {selectedCategory ? (
                        <div className="selected-item">
                          <span>
                            {selectedCategory?.name || selectedCategory}
                          </span>
                        </div>
                      ) : (
                        <small className="text-gray-500">
                          Chưa có danh mục kỹ năng. Nhấn "Thêm kỹ năng" để chọn.
                        </small>
                      )}
                    </FieldGroup>

                    {/* show selected skills only; adding/selecting done via modal */}
                    <FieldGroup title="Kỹ năng">
                      {selectedSkillsData.length > 0 ? (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Kỹ năng đã chọn:
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {selectedSkillsData.map((skill) => (
                              <span
                                key={skill.id}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                              >
                                {skill.name}
                                {skill.category && (
                                  <span className="text-blue-600 ml-1">
                                    ({skill.category.name || skill.category})
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeSkill(skill.id)}
                                  className="ml-2 text-blue-600 hover:text-blue-800"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <small className="text-gray-500">
                          Chưa có kỹ năng nào. Nhấn "Thêm kỹ năng" để thêm.
                        </small>
                      )}
                    </FieldGroup>
                  </FieldCard>
                </div>
              )}

              {/* Tab: Work Arrangements */}
              {activeTab === "work" && (
                <div
                  role="tabpanel"
                  id="tabpanel-work"
                  aria-labelledby="tab-work"
                >
                  <FieldCard
                    title="Điều kiện làm việc"
                    subtitle="Thiết lập các điều kiện và yêu cầu làm việc"
                    icon={<span className="text-xl">⚙️</span>}
                  >
                    <div className="space-y-6">
                      <FieldGroup title="Làm việc từ xa">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            name="work_arrangements.is_remote_allowed"
                            checked={form.work_arrangements.is_remote_allowed}
                            onChange={onChange}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Cho phép làm việc từ xa
                          </span>
                        </label>

                        {form.work_arrangements.is_remote_allowed && (
                          <div className="ml-7">
                            <label className="block">
                              <span className="block text-sm font-medium text-gray-700 mb-2">
                                Phần trăm làm việc từ xa (%)
                              </span>
                              <input
                                type="number"
                                name="work_arrangements.remote_percentage"
                                value={form.work_arrangements.remote_percentage}
                                onChange={onChange}
                                min="0"
                                max="100"
                                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                  fieldErrors.remote_percentage
                                    ? "border-red-300"
                                    : "border-gray-300"
                                }`}
                              />
                              {fieldErrors.remote_percentage && (
                                <small className="text-red-600 mt-1 block">
                                  {fieldErrors.remote_percentage}
                                </small>
                              )}
                              <small className="text-gray-500 mt-1 block">
                                0-100%
                              </small>
                            </label>
                          </div>
                        )}
                      </FieldGroup>

                      <FieldGroup title="Giờ làm việc & Ca làm việc">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            name="work_arrangements.flexible_hours"
                            checked={form.work_arrangements.flexible_hours}
                            onChange={onChange}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Giờ làm việc linh hoạt
                          </span>
                        </label>

                        <label className="block">
                          <span className="block text-sm font-medium text-gray-700 mb-2">
                            Loại ca làm việc
                          </span>
                          <select
                            name="work_arrangements.shift_type"
                            value={form.work_arrangements.shift_type}
                            onChange={onChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Chọn loại ca...</option>
                            {SHIFT_TYPE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </FieldGroup>

                      <FieldGroup title="Công tác & Làm thêm">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            name="work_arrangements.overtime_expected"
                            checked={form.work_arrangements.overtime_expected}
                            onChange={onChange}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Có thể làm thêm giờ
                          </span>
                        </label>

                        <label className="block">
                          <span className="block text-sm font-medium text-gray-700 mb-2">
                            Yêu cầu đi công tác
                          </span>
                          <input
                            type="text"
                            name="work_arrangements.travel_requirement"
                            value={form.work_arrangements.travel_requirement}
                            onChange={onChange}
                            placeholder="VD: Thỉnh thoảng đi công tác"
                            maxLength={50}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </label>
                      </FieldGroup>
                    </div>
                  </FieldCard>
                </div>
              )}

              {/* Form Actions */}
              <div className="mt-8 flex justify-end space-x-3">
                {getActionButtons()}
              </div>
            </form>
          </JobFormSection>
        </JobFormColumn>
      </JobFormGrid>

      {/* Add Requirement Modal */}
      <Modal
        isOpen={showAddRequirementModal}
        onClose={() => {
          setShowAddRequirementModal(false);
          setModalReqForm({
            requirement_type: "",
            title: "",
            description: "",
            is_required: true,
            level: "",
            years_experience: "",
          });
        }}
        title="Thêm yêu cầu công việc"
        size="medium"
      >
        <div className="space-y-3">
          <label className="block">
            <span>Loại yêu cầu</span>
            <Select
              value={modalReqForm.requirement_type}
              onChange={(e) =>
                setModalReqForm((p) => ({
                  ...p,
                  requirement_type: e.target.value,
                }))
              }
              options={REQUIREMENT_TYPE_OPTIONS}
              placeholder="Chọn loại..."
            />
          </label>
          <label className="block">
            <span>Tiêu đề</span>
            <Input
              value={modalReqForm.title}
              onChange={(e) =>
                setModalReqForm((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="Tiêu đề yêu cầu..."
            />
          </label>
          <label className="block">
            <span>Mô tả</span>
            <Textarea
              value={modalReqForm.description}
              onChange={(e) =>
                setModalReqForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={3}
            />
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={modalReqForm.is_required}
                onChange={(e) =>
                  setModalReqForm((p) => ({
                    ...p,
                    is_required: e.target.checked,
                  }))
                }
              />
              <span>Bắt buộc</span>
            </label>
            <Input
              value={modalReqForm.level}
              onChange={(e) =>
                setModalReqForm((p) => ({ ...p, level: e.target.value }))
              }
              placeholder="Mức độ (ví dụ: Trung cấp)"
            />
            <Input
              value={modalReqForm.years_experience}
              onChange={(e) =>
                setModalReqForm((p) => ({
                  ...p,
                  years_experience: e.target.value,
                }))
              }
              placeholder="Số năm KN"
              type="number"
            />
          </div>
        </div>
        <div className="modal-actions">
          <Button
            variant="ghost"
            onClick={() => setShowAddRequirementModal(false)}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              handleModalAddReq(modalReqForm);
              setModalReqForm({
                requirement_type: "",
                title: "",
                description: "",
                is_required: true,
                level: "",
                years_experience: "",
              });
            }}
          >
            Thêm
          </Button>
        </div>
      </Modal>

      {/* Add Benefit Modal */}
      <Modal
        isOpen={showAddBenefitModal}
        onClose={() => {
          setShowAddBenefitModal(false);
          setModalBenForm({
            benefit_type: "",
            title: "",
            description: "",
            value_amount: "",
            value_currency: "VND",
          });
        }}
        title="Thêm phúc lợi"
        size="medium"
      >
        <div className="space-y-3">
          <label className="block">
            <span>Loại phúc lợi</span>
            <Select
              value={modalBenForm.benefit_type}
              onChange={(e) =>
                setModalBenForm((p) => ({ ...p, benefit_type: e.target.value }))
              }
              options={BENEFIT_TYPE_OPTIONS}
              placeholder="Chọn loại..."
            />
          </label>
          <label className="block">
            <span>Tiêu đề</span>
            <Input
              value={modalBenForm.title}
              onChange={(e) =>
                setModalBenForm((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="Tiêu đề phúc lợi..."
            />
          </label>
          <label className="block">
            <span>Mô tả</span>
            <Textarea
              value={modalBenForm.description}
              onChange={(e) =>
                setModalBenForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={3}
            />
          </label>
          <div className="flex items-center gap-4">
            <Input
              value={modalBenForm.value_amount}
              onChange={(e) =>
                setModalBenForm((p) => ({ ...p, value_amount: e.target.value }))
              }
              placeholder="Giá trị (số)"
              type="number"
            />
            <select
              value={modalBenForm.value_currency}
              onChange={(e) =>
                setModalBenForm((p) => ({
                  ...p,
                  value_currency: e.target.value,
                }))
              }
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="VND">VND</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
        <div className="modal-actions">
          <Button variant="ghost" onClick={() => setShowAddBenefitModal(false)}>
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              handleModalAddBen(modalBenForm);
              setModalBenForm({
                benefit_type: "",
                title: "",
                description: "",
                value_amount: "",
                value_currency: "VND",
              });
            }}
          >
            Thêm
          </Button>
        </div>
      </Modal>

      {/* Add Skills Modal */}
      <Modal
        isOpen={showAddSkillsModal}
        onClose={() => {
          setShowAddSkillsModal(false);
          setModalSkillsForm({
            category: selectedCategory?.id || "",
            skills: [],
          });
        }}
        title="Thêm kỹ năng"
        size="medium"
      >
        <div className="space-y-3">
          <label className="block">
            <span>Danh mục kỹ năng</span>
            <Select
              value={modalSkillsForm.category}
              onChange={(e) => {
                const val = e.target.value;
                setModalSkillsForm((p) => ({
                  ...p,
                  category: val,
                  skills: [],
                }));
                const cat = skillCategories.find(
                  (c) => (c.id || c.name) === val
                );
                if (cat) handleCategorySelect(cat);
              }}
              options={skillCategories.map((c) => ({
                value: c.id || c.name,
                label: c.name || c,
              }))}
              placeholder="Chọn danh mục..."
            />
          </label>

          <label className="block">
            <span>Chọn kỹ năng (có thể chọn nhiều)</span>
            <SearchableSelect
              options={availableSkills.map((s) => ({
                value: s.id,
                label: s.name,
              }))}
              value={modalSkillsForm.skills}
              onChange={(vals) =>
                setModalSkillsForm((p) => ({ ...p, skills: vals }))
              }
              multiple={true}
              placeholder="Chọn kỹ năng..."
              loading={loadingSkills}
            />
            {!modalSkillsForm.category && (
              <small className="text-gray-500">
                Vui lòng chọn danh mục trước
              </small>
            )}
          </label>
        </div>
        <div className="modal-actions">
          <Button variant="ghost" onClick={() => setShowAddSkillsModal(false)}>
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              // Add all selected skills in one state update to avoid race conditions
              const selectedIds = modalSkillsForm.skills || [];
              if (selectedIds.length > 0) {
                // Normalize comparisons to strings to avoid type mismatch (number vs string)
                const skillObjs = selectedIds
                  .map((skillId) => {
                    const idStr = String(skillId);
                    return (
                      availableSkills.find((s) => String(s.id) === idStr) ||
                      initialSkills.find((s) => String(s.id) === idStr) ||
                      null
                    );
                  })
                  .filter(Boolean);

                // Debugging info — remove if not needed
                console.debug("Add skills modal - selectedIds:", selectedIds);
                console.debug(
                  "Add skills modal - resolved skillObjs:",
                  skillObjs
                );

                if (skillObjs.length > 0) {
                  // Use functional updates only (avoid reading `form`/`selectedSkillsData` closures)
                  const findSkillById = (id) => {
                    const idStr = String(id);
                    return (
                      availableSkills.find((s) => String(s.id) === idStr) ||
                      initialSkills.find((s) => String(s.id) === idStr) ||
                      null
                    );
                  };

                  console.debug("Add skills modal - selectedIds:", selectedIds);

                  // Update form.skill_ids using functional updater to avoid stale closures
                  setForm((prev) => {
                    const existingIds = new Set(
                      (prev.skill_ids || []).map((i) => String(i))
                    );
                    const toAdd = selectedIds
                      .map((id) => String(id))
                      .filter((id) => !existingIds.has(id));
                    const newSkillIds = [...(prev.skill_ids || []), ...toAdd];
                    console.debug(
                      "Add skills modal - form.skill_ids before:",
                      prev.skill_ids,
                      "toAdd:",
                      toAdd,
                      "after:",
                      newSkillIds
                    );
                    return { ...prev, skill_ids: newSkillIds };
                  });

                  // Update selectedSkillsData using functional updater
                  setSelectedSkillsData((prev) => {
                    const existingIds = new Set(
                      (prev || []).map((s) => String(s.id))
                    );
                    const toAddObjs = [];
                    selectedIds.forEach((id) => {
                      const obj = findSkillById(id);
                      if (obj && !existingIds.has(String(obj.id))) {
                        toAddObjs.push(obj);
                      }
                    });
                    const result = [...(prev || []), ...toAddObjs];
                    console.debug(
                      "Add skills modal - selectedSkillsData before:",
                      prev,
                      "toAddObjs:",
                      toAddObjs,
                      "after:",
                      result
                    );
                    return result;
                  });
                }
              }

              setModalSkillsForm({
                category: selectedCategory?.id || "",
                skills: [],
              });
              setShowAddSkillsModal(false);
            }}
            disabled={
              !modalSkillsForm.skills || modalSkillsForm.skills.length === 0
            }
          >
            Thêm
          </Button>
        </div>
      </Modal>

      {/* Preview Modal */}
      <PreviewModalWrapper
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Xem trước tin tuyển dụng"
        size="large"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center pb-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {form.title || "Chưa có tiêu đề"}
            </h2>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
              <span className="flex items-center">
                📅{" "}
                {form.expires_at
                  ? new Date(form.expires_at).toLocaleDateString("vi-VN")
                  : "Chưa đặt"}
              </span>
              <span className="flex items-center">
                💼{" "}
                {JOB_TYPE_OPTIONS.find((opt) => opt.value === form.job_type)
                  ?.label || form.job_type}
              </span>
              {form.experience_level && (
                <span className="flex items-center">
                  ⭐ {form.experience_level} năm kinh nghiệm
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <PreviewSection title="Mô tả công việc" icon="📝">
            <p className="text-gray-700 leading-relaxed">
              {form.description || "Chưa có mô tả"}
            </p>
          </PreviewSection>

          {/* Basic Info */}
          <PreviewSection title="Thông tin cơ bản" icon="🏢">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PreviewItem icon="🏢">
                <strong>Công ty:</strong> {company?.name || "Chưa chọn"}
              </PreviewItem>
              <PreviewItem icon="📍">
                <strong>Địa điểm:</strong>{" "}
                {selectedDistrict
                  ? `${selectedDistrict.name}, ${selectedProvince?.name || ""}`
                  : selectedProvince
                  ? selectedProvince.name
                  : "Chưa chọn"}
              </PreviewItem>
              <PreviewItem icon="🎯">
                <strong>Kinh nghiệm:</strong>{" "}
                {form.experience_level
                  ? `${form.experience_level} năm`
                  : "Không yêu cầu"}
              </PreviewItem>
              <PreviewItem icon="💰">
                <strong>Mức lương:</strong>{" "}
                {form.salary_min && form.salary_max
                  ? `${parseInt(form.salary_min).toLocaleString()} - ${parseInt(
                      form.salary_max
                    ).toLocaleString()} ${form.currency}`
                  : "Thỏa thuận"}
              </PreviewItem>
            </div>
          </PreviewSection>

          {/* Requirements */}
          {form.requirements.length > 0 && (
            <PreviewSection title="Yêu cầu công việc" icon="✅">
              <ul className="space-y-3">
                {form.requirements
                  .filter((req) => req.title?.trim() && req.requirement_type)
                  .map((req, idx) => (
                    <li key={idx} className="flex items-start space-x-3">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <div>
                        <strong className="text-blue-700">
                          {
                            REQUIREMENT_TYPE_OPTIONS.find(
                              (opt) => opt.value === req.requirement_type
                            )?.label
                          }
                          :
                        </strong>{" "}
                        {req.title}
                        {req.description && (
                          <p className="text-gray-600 text-sm mt-1 ml-0">
                            {req.description}
                          </p>
                        )}
                        {(req.level || req.years_experience) && (
                          <p className="text-xs text-gray-500 mt-1">
                            {req.level && `Mức độ: ${req.level}`}
                            {req.level && req.years_experience && " • "}
                            {req.years_experience &&
                              `${req.years_experience} năm kinh nghiệm`}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
              </ul>
            </PreviewSection>
          )}

          {/* Benefits */}
          {form.benefits.length > 0 && (
            <PreviewSection title="Phúc lợi" icon="🎁">
              <ul className="space-y-3">
                {form.benefits
                  .filter((ben) => ben.title?.trim() && ben.benefit_type)
                  .map((ben, idx) => (
                    <li key={idx} className="flex items-start space-x-3">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <div>
                        <strong className="text-green-700">
                          {
                            BENEFIT_TYPE_OPTIONS.find(
                              (opt) => opt.value === ben.benefit_type
                            )?.label
                          }
                          :
                        </strong>{" "}
                        {ben.title}
                        {ben.description && (
                          <p className="text-gray-600 text-sm mt-1 ml-0">
                            {ben.description}
                          </p>
                        )}
                        {ben.value_amount && (
                          <p className="text-xs text-gray-500 mt-1">
                            Giá trị: {ben.value_amount}{" "}
                            {ben.value_currency || "VND"}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
              </ul>
            </PreviewSection>
          )}

          {/* Skills */}
          {form.skill_ids.length > 0 && (
            <PreviewSection title="Kỹ năng yêu cầu" icon="🛠️">
              <div className="flex flex-wrap gap-2">
                {selectedSkillsData.map((skill) => (
                  <Badge key={skill.id} variant="primary" size="small">
                    {skill.name}
                  </Badge>
                ))}
              </div>
            </PreviewSection>
          )}

          {/* Work Arrangements */}
          {(form.work_arrangements.is_remote_allowed ||
            form.work_arrangements.flexible_hours ||
            form.work_arrangements.travel_requirement ||
            form.work_arrangements.overtime_expected ||
            form.work_arrangements.shift_type) && (
            <PreviewSection title="Điều kiện làm việc" icon="⚙️">
              <ul className="space-y-2">
                {form.work_arrangements.is_remote_allowed && (
                  <PreviewItem icon="🏠">
                    Làm việc từ xa: {form.work_arrangements.remote_percentage}%
                  </PreviewItem>
                )}
                {form.work_arrangements.flexible_hours && (
                  <PreviewItem icon="⏰">Giờ làm việc linh hoạt</PreviewItem>
                )}
                {form.work_arrangements.travel_requirement && (
                  <PreviewItem icon="✈️">
                    Đi công tác: {form.work_arrangements.travel_requirement}
                  </PreviewItem>
                )}
                {form.work_arrangements.overtime_expected && (
                  <PreviewItem icon="⏱️">Có thể làm thêm giờ</PreviewItem>
                )}
                {form.work_arrangements.shift_type && (
                  <PreviewItem icon="📅">
                    Ca làm việc:{" "}
                    {
                      SHIFT_TYPE_OPTIONS.find(
                        (opt) => opt.value === form.work_arrangements.shift_type
                      )?.label
                    }
                  </PreviewItem>
                )}
              </ul>
            </PreviewSection>
          )}
        </div>
      </PreviewModalWrapper>
    </div>
  );
}
