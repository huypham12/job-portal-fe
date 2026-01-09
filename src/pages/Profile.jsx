import { useEffect, useMemo, useRef, useState } from "react";
import SimpleModal from "../components/Modal.jsx";
import { ProfileClient } from "../services/profileClient";
import { UploadClient } from "../services/uploadClient";
import { LocationService, SkillService } from "../lib/api.js";
import { calculateProfileCompletion } from "../utils/profileCompletion";

const jobTypeOptions = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Hợp đồng" },
];

const genderOptions = [
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
  { value: "other", label: "Khác" },
];

const currencyOptions = ["VND", "USD", "EUR"];
const skillLevelOptions = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
];

const awardCategoryOptions = [
  { value: "academic", label: "Học thuật" },
  { value: "professional", label: "Chuyên môn" },
  { value: "competition", label: "Cuộc thi" },
  { value: "volunteer", label: "Tình nguyện" },
  { value: "other", label: "Khác" },
];

const awardLevelOptions = [
  { value: "international", label: "Quốc tế" },
  { value: "national", label: "Quốc gia" },
  { value: "regional", label: "Khu vực" },
  { value: "local", label: "Địa phương" },
  { value: "organizational", label: "Nội bộ" },
];

const blankForm = () => ({
  full_name: "",
  display_name: "",
  headline: "",
  date_of_birth: "",
  gender: "",
  phone_number: "",
  personal_website: "",
  linkedin_url: "",
  github_url: "",
  location_id: "",
  location_text: "",
  bio: "",
  years_of_experience: "",
  desired_job_title: "",
  desired_salary_min: "",
  desired_currency: "VND",
  desired_job_type: [],
  is_looking_for_job: false,
});

const toFormState = (profile) => {
  if (!profile) return blankForm();
  return {
    full_name: profile.full_name || "",
    display_name: profile.display_name || "",
    headline: profile.headline || "",
    date_of_birth: profile.date_of_birth
      ? profile.date_of_birth.slice(0, 10)
      : "",
    gender: profile.gender || "",
    phone_number: profile.phone_number || "",
    personal_website: profile.personal_website || "",
    linkedin_url: profile.linkedin_url || "",
    github_url: profile.github_url || "",
    location_id: profile.location_id || "",
    location_text: profile.location_text || "",
    bio: profile.bio || "",
    years_of_experience:
      typeof profile.years_of_experience === "number"
        ? String(profile.years_of_experience)
        : "",
    desired_job_title: profile.desired_job_title || "",
    desired_salary_min:
      typeof profile.desired_salary_min === "number"
        ? String(profile.desired_salary_min)
        : "",
    desired_currency: profile.desired_currency || "VND",
    desired_job_type: Array.isArray(profile.desired_job_type)
      ? profile.desired_job_type
      : [],
    is_looking_for_job:
      typeof profile.is_looking_for_job === "boolean"
        ? profile.is_looking_for_job
        : false,
  };
};

const getErrorMessage = (error, fallback) => {
  const details = error?.data?.errors;
  if (Array.isArray(details) && details.length) {
    const merged = details
      .map((item) => item?.message)
      .filter(Boolean)
      .join(" • ");
    if (merged) return merged;
  }
  return error?.data?.message || error?.message || fallback;
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN", { month: "short", year: "numeric" });
};

const formatDateRange = (start, end, isCurrent) => {
  const startText = formatDate(start) || "—";
  const endText = isCurrent ? "Hiện tại" : formatDate(end) || "—";
  return `${startText} – ${endText}`;
};

const buildPayload = (form, selectedDistrict, selectedProvince) => {
  const payload = {};
  Object.entries(form).forEach(([key, value]) => {
    if (key === "desired_job_type") {
      if (value.length) payload[key] = value;
      return;
    }
    if (key === "years_of_experience" || key === "desired_salary_min") {
      if (value === "" || value === null || value === undefined) return;
      const num = Number(value);
      if (Number.isFinite(num)) payload[key] = num;
      return;
    }
    if (key === "is_looking_for_job") {
      if (typeof value === "boolean") payload[key] = value;
      return;
    }
    // Handle location_id separately
    if (key === "location_id") {
      return;
    }
    // Skip location_text if we have location_id
    if (key === "location_text") {
      return;
    }
    if (value === undefined || value === null) return;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) payload[key] = trimmed;
    }
  });

  // Handle location - prefer location_id if available
  if (selectedDistrict?.id) {
    payload.location_id = selectedDistrict.id;
    // Auto-generate location_text from selection
    const locationParts = [];
    if (selectedDistrict?.name) locationParts.push(selectedDistrict.name);
    if (selectedProvince?.name) locationParts.push(selectedProvince.name);
    if (locationParts.length) {
      payload.location_text = locationParts.join(", ");
    }
  } else if (form.location_text?.trim()) {
    payload.location_text = form.location_text.trim();
  }

  return payload;
};

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [userMeta, setUserMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [createForm, setCreateForm] = useState(() => blankForm());
  const [updateForm, setUpdateForm] = useState(() => blankForm());

  const [createStatus, setCreateStatus] = useState({
    loading: false,
    message: "",
    error: "",
  });
  const [updateStatus, setUpdateStatus] = useState({
    loading: false,
    message: "",
    error: "",
  });

  const [entityModal, setEntityModal] = useState({
    type: "",
    mode: "create",
    record: null,
  });
  const [entityForm, setEntityForm] = useState({});
  const [entityModalError, setEntityModalError] = useState("");
  const [entityModalLoading, setEntityModalLoading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);

  // Location cascading dropdown states - Create form
  const [provinces, setProvinces] = useState([]);
  const [initialProvinces, setInitialProvinces] = useState([]);
  const [selectedProvinceCreate, setSelectedProvinceCreate] = useState(null);
  const [provinceSearchCreate, setProvinceSearchCreate] = useState("");
  const [showProvinceDropdownCreate, setShowProvinceDropdownCreate] =
    useState(false);

  const [availableDistrictsCreate, setAvailableDistrictsCreate] = useState([]);
  const [initialDistrictsCreate, setInitialDistrictsCreate] = useState([]);
  const [selectedDistrictCreate, setSelectedDistrictCreate] = useState(null);
  const [districtSearchCreate, setDistrictSearchCreate] = useState("");
  const [showDistrictDropdownCreate, setShowDistrictDropdownCreate] =
    useState(false);
  const [loadingDistrictsCreate, setLoadingDistrictsCreate] = useState(false);
  // Skill selection states (for entity modal)
  const [skillCategories, setSkillCategories] = useState([]);
  const [initialSkillCategories, setInitialSkillCategories] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [initialAvailableSkills, setInitialAvailableSkills] = useState([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [loadingSkills, setLoadingSkills] = useState(false);

  // Location cascading dropdown states - Update form
  const [selectedProvinceUpdate, setSelectedProvinceUpdate] = useState(null);
  const [provinceSearchUpdate, setProvinceSearchUpdate] = useState("");
  const [showProvinceDropdownUpdate, setShowProvinceDropdownUpdate] =
    useState(false);

  const [availableDistrictsUpdate, setAvailableDistrictsUpdate] = useState([]);
  const [initialDistrictsUpdate, setInitialDistrictsUpdate] = useState([]);
  const [selectedDistrictUpdate, setSelectedDistrictUpdate] = useState(null);
  const [districtSearchUpdate, setDistrictSearchUpdate] = useState("");
  const [showDistrictDropdownUpdate, setShowDistrictDropdownUpdate] =
    useState(false);
  const [loadingDistrictsUpdate, setLoadingDistrictsUpdate] = useState(false);
  const [isLoadingLocationHierarchy, setIsLoadingLocationHierarchy] =
    useState(false);

  useEffect(() => {
    loadProfile();
    loadUserMeta();
  }, []);

  // Load provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await LocationService.getProvinces();
        const data = response.data || [];
        setProvinces(data);
        setInitialProvinces(data);
      } catch (err) {
        console.error("Failed to fetch provinces:", err);
      }
    };
    fetchProvinces();
  }, []);

  // Filter provinces based on search - Create form
  useEffect(() => {
    if (!provinceSearchCreate.trim()) {
      setProvinces(initialProvinces);
      return;
    }
    const filtered = initialProvinces.filter((province) =>
      province.name.toLowerCase().includes(provinceSearchCreate.toLowerCase())
    );
    setProvinces(filtered);
  }, [provinceSearchCreate, initialProvinces]);

  // Filter provinces based on search - Update form
  const filteredProvincesUpdate = useMemo(() => {
    if (!provinceSearchUpdate.trim()) {
      return initialProvinces;
    }
    return initialProvinces.filter((province) =>
      province.name.toLowerCase().includes(provinceSearchUpdate.toLowerCase())
    );
  }, [provinceSearchUpdate, initialProvinces]);

  // Fetch districts when province is selected - Create form
  useEffect(() => {
    if (!selectedProvinceCreate) {
      setAvailableDistrictsCreate([]);
      setInitialDistrictsCreate([]);
      setDistrictSearchCreate("");
      setSelectedDistrictCreate(null);
      return;
    }

    const fetchDistricts = async () => {
      setLoadingDistrictsCreate(true);
      try {
        const response = await LocationService.getDistricts(
          selectedProvinceCreate.id
        );
        const data = response.data || [];
        setAvailableDistrictsCreate(data);
        setInitialDistrictsCreate(data);
        setSelectedDistrictCreate(null);
        setDistrictSearchCreate("");
        setCreateForm((prev) => ({ ...prev, location_id: "" }));
      } catch (err) {
        console.error("Failed to fetch districts:", err);
        setAvailableDistrictsCreate([]);
        setInitialDistrictsCreate([]);
      } finally {
        setLoadingDistrictsCreate(false);
      }
    };

    fetchDistricts();
  }, [selectedProvinceCreate]);

  // Load skill categories on mount for entity modal (skills)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await SkillService.getCategories();
        const data = res?.data || [];
        // map to names for select options (frontend currently expects string categories)
        const names = data.map((c) =>
          typeof c === "string" ? c : c.name || c
        );
        setSkillCategories(names);
        setInitialSkillCategories(names);
      } catch (err) {
        console.error("Failed to fetch skill categories:", err);
        setSkillCategories([]);
        setInitialSkillCategories([]);
      }
    };
    fetchCategories();
  }, []);

  const fetchSkillsForCategory = async (category) => {
    if (!category) {
      setAvailableSkills([]);
      setInitialAvailableSkills([]);
      return;
    }
    setLoadingSkills(true);
    try {
      const res = await SkillService.search({ category, limit: 500 });
      const data = res?.data || [];
      setAvailableSkills(data);
      setInitialAvailableSkills(data);
    } catch (err) {
      console.error("Failed to fetch skills for category:", err);
      setAvailableSkills([]);
      setInitialAvailableSkills([]);
    } finally {
      setLoadingSkills(false);
    }
  };

  // Fetch districts when province is selected - Update form
  useEffect(() => {
    if (!selectedProvinceUpdate) {
      setAvailableDistrictsUpdate([]);
      setInitialDistrictsUpdate([]);
      setDistrictSearchUpdate("");
      if (!isLoadingLocationHierarchy) {
        setSelectedDistrictUpdate(null);
      }
      return;
    }

    const fetchDistricts = async () => {
      setLoadingDistrictsUpdate(true);
      try {
        const response = await LocationService.getDistricts(
          selectedProvinceUpdate.id
        );
        const data = response.data || [];
        setAvailableDistrictsUpdate(data);
        setInitialDistrictsUpdate(data);
        if (!isLoadingLocationHierarchy) {
          setSelectedDistrictUpdate(null);
          setDistrictSearchUpdate("");
          setUpdateForm((prev) => ({ ...prev, location_id: "" }));
        }
      } catch (err) {
        console.error("Failed to fetch districts:", err);
        setAvailableDistrictsUpdate([]);
        setInitialDistrictsUpdate([]);
      } finally {
        setLoadingDistrictsUpdate(false);
      }
    };

    fetchDistricts();
  }, [selectedProvinceUpdate, isLoadingLocationHierarchy]);

  // Filter districts based on search - Create form
  useEffect(() => {
    if (!districtSearchCreate.trim()) {
      setAvailableDistrictsCreate(initialDistrictsCreate);
      return;
    }
    const filtered = initialDistrictsCreate.filter((district) =>
      district.name.toLowerCase().includes(districtSearchCreate.toLowerCase())
    );
    setAvailableDistrictsCreate(filtered);
  }, [districtSearchCreate, initialDistrictsCreate]);

  // Filter districts based on search - Update form
  const filteredDistrictsUpdate = useMemo(() => {
    if (!districtSearchUpdate.trim()) {
      return initialDistrictsUpdate;
    }
    return initialDistrictsUpdate.filter((district) =>
      district.name.toLowerCase().includes(districtSearchUpdate.toLowerCase())
    );
  }, [districtSearchUpdate, initialDistrictsUpdate]);

  // Load location hierarchy when profile has location_id - Update form
  useEffect(() => {
    const loadLocationHierarchy = async () => {
      if (!profile?.location_id || profile.location_id.trim() === "") {
        return;
      }

      // Skip if already loaded
      if (
        selectedProvinceUpdate &&
        selectedDistrictUpdate &&
        selectedDistrictUpdate.id === profile.location_id
      ) {
        return;
      }

      setIsLoadingLocationHierarchy(true);
      try {
        const locationResponse = await LocationService.getById(
          profile.location_id
        );
        const location = locationResponse.data;

        if (!location) {
          setIsLoadingLocationHierarchy(false);
          return;
        }

        // If location has parent_id, it's a district
        if (location.parent_id) {
          const provinceResponse = await LocationService.getById(
            location.parent_id
          );
          const province = provinceResponse.data;

          if (province) {
            setSelectedProvinceUpdate(province);
            setProvinceSearchUpdate(province.name);

            // Wait for districts to load then set selected district
            setTimeout(async () => {
              try {
                const districtsResponse = await LocationService.getDistricts(
                  province.id
                );
                const districts = districtsResponse.data || [];
                setAvailableDistrictsUpdate(districts);
                setInitialDistrictsUpdate(districts);

                const district = districts.find(
                  (d) => d.id === profile.location_id
                );
                if (district) {
                  setSelectedDistrictUpdate(district);
                  setDistrictSearchUpdate(district.name);
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
          setSelectedProvinceUpdate(location);
          setProvinceSearchUpdate(location.name);
          setIsLoadingLocationHierarchy(false);
        }
      } catch (err) {
        console.error("Failed to load location hierarchy:", err);
        setIsLoadingLocationHierarchy(false);
      }
    };

    loadLocationHierarchy();
  }, [profile?.location_id]);

  const loadUserMeta = async () => {
    try {
      const res = await ProfileClient.getMe();
      setUserMeta(res?.data || res);
    } catch (err) {
      console.warn("Không thể tải thông tin người dùng:", err?.message);
    }
  };

  const loadProfile = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const res = await ProfileClient.get();
      const data = res?.data;
      const merged = {
        ...(profile || {}),
        ...(data || {}),
        experiences: data?.experiences ?? profile?.experiences ?? [],
        educations: data?.educations ?? profile?.educations ?? [],
        skills: data?.skills ?? profile?.skills ?? [],
        certifications: data?.certifications ?? profile?.certifications ?? [],
        awards: data?.awards ?? profile?.awards ?? [],
      };
      setProfile(merged);
      setUpdateForm(toFormState(merged));
    } catch (err) {
      if (err.status === 404) {
        setProfile(null);
        setActiveTab("create");
      } else {
        setFetchError(getErrorMessage(err, "Không thể tải dữ liệu hồ sơ."));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleCreateJobType = (value) => {
    setCreateForm((prev) => ({
      ...prev,
      desired_job_type: prev.desired_job_type.includes(value)
        ? prev.desired_job_type.filter((opt) => opt !== value)
        : [...prev.desired_job_type, value],
    }));
  };

  const toggleUpdateJobType = (value) => {
    setUpdateForm((prev) => ({
      ...prev,
      desired_job_type: prev.desired_job_type.includes(value)
        ? prev.desired_job_type.filter((opt) => opt !== value)
        : [...prev.desired_job_type, value],
    }));
  };

  const handleCreateLooking = () =>
    setCreateForm((prev) => ({
      ...prev,
      is_looking_for_job: !prev.is_looking_for_job,
    }));

  const handleUpdateLooking = () =>
    setUpdateForm((prev) => ({
      ...prev,
      is_looking_for_job: !prev.is_looking_for_job,
    }));

  // Location handlers - Create form
  const handleProvinceSelectCreate = (province) => {
    setSelectedProvinceCreate(province);
    setProvinceSearchCreate(province.name);
    setShowProvinceDropdownCreate(false);
  };

  const handleDistrictSelectCreate = (district) => {
    setSelectedDistrictCreate(district);
    setDistrictSearchCreate(district.name);
    setShowDistrictDropdownCreate(false);
    setCreateForm((prev) => ({ ...prev, location_id: district.id }));
  };

  const handleClearProvinceCreate = () => {
    setSelectedProvinceCreate(null);
    setProvinceSearchCreate("");
    setAvailableDistrictsCreate([]);
    setInitialDistrictsCreate([]);
    setSelectedDistrictCreate(null);
    setDistrictSearchCreate("");
    setCreateForm((prev) => ({ ...prev, location_id: "" }));
  };

  const handleClearDistrictCreate = () => {
    setSelectedDistrictCreate(null);
    setDistrictSearchCreate("");
    setCreateForm((prev) => ({ ...prev, location_id: "" }));
  };

  // Location handlers - Update form
  const handleProvinceSelectUpdate = (province) => {
    setSelectedProvinceUpdate(province);
    setProvinceSearchUpdate(province.name);
    setShowProvinceDropdownUpdate(false);
  };

  const handleDistrictSelectUpdate = (district) => {
    setSelectedDistrictUpdate(district);
    setDistrictSearchUpdate(district.name);
    setShowDistrictDropdownUpdate(false);
    setUpdateForm((prev) => ({ ...prev, location_id: district.id }));
  };

  const handleClearProvinceUpdate = () => {
    setSelectedProvinceUpdate(null);
    setProvinceSearchUpdate("");
    setAvailableDistrictsUpdate([]);
    setInitialDistrictsUpdate([]);
    setSelectedDistrictUpdate(null);
    setDistrictSearchUpdate("");
    setUpdateForm((prev) => ({ ...prev, location_id: "" }));
  };

  const handleClearDistrictUpdate = () => {
    setSelectedDistrictUpdate(null);
    setDistrictSearchUpdate("");
    setUpdateForm((prev) => ({ ...prev, location_id: "" }));
  };

  const onCreate = async (e) => {
    e.preventDefault();
    setCreateStatus({ loading: true, message: "", error: "" });
    const payload = buildPayload(
      createForm,
      selectedDistrictCreate,
      selectedProvinceCreate
    );
    if (!payload.full_name) {
      setCreateStatus({
        loading: false,
        message: "",
        error: "Họ tên là bắt buộc.",
      });
      return;
    }
    try {
      const res = await ProfileClient.create(payload);
      const data = res?.data;
      setCreateStatus({
        loading: false,
        message: "Đã tạo hồ sơ thành công.",
        error: "",
      });
      setProfile(data);
      setUpdateForm(toFormState(data));
    } catch (err) {
      setCreateStatus({
        loading: false,
        message: "",
        error: getErrorMessage(err, "Không thể tạo hồ sơ."),
      });
    }
  };

  const onUpdate = async (e) => {
    e.preventDefault();
    setUpdateStatus({ loading: true, message: "", error: "" });
    // Debug: log location-related state to help debug lost district after refresh
    console.log("🔧 onUpdate - location debug:", {
      selectedProvinceUpdate,
      selectedDistrictUpdate,
      formLocationId: updateForm.location_id,
      profileLocationId: profile?.location_id,
    });

    let payload = buildPayload(
      updateForm,
      selectedDistrictUpdate,
      selectedProvinceUpdate
    );
    // Ensure payload.location_id explicitly set from selected district if available
    if (selectedDistrictUpdate?.id) {
      payload.location_id = selectedDistrictUpdate.id;
    }
    if (Object.keys(payload).length === 0) {
      setUpdateStatus({
        loading: false,
        message: "",
        error: "Hãy thay đổi ít nhất một trường trước khi cập nhật.",
      });
      return;
    }
    try {
      await ProfileClient.update(payload);
      setUpdateStatus({
        loading: false,
        message: "Đã cập nhật hồ sơ.",
        error: "",
      });
      // Reload toàn bộ data để lấy đầy đủ related entities (experiences, educations, skills, etc.)
      await loadProfile();
    } catch (err) {
      setUpdateStatus({
        loading: false,
        message: "",
        error: getErrorMessage(err, "Không thể cập nhật hồ sơ."),
      });
    }
  };

  const summary = useMemo(() => {
    if (!profile) return null;
    const jobTypes = (profile.desired_job_type || []).map((type) => {
      const found = jobTypeOptions.find((opt) => opt.value === type);
      return found ? found.label : type;
    });
    const normalizeText = (val) => {
      if (!val && val !== "") return "";
      if (typeof val === "string") return val;
      if (val && typeof val === "object") return val.name || String(val);
      return String(val);
    };
    return {
      name: normalizeText(profile.full_name),
      headline: normalizeText(profile.headline),
      location: normalizeText(profile.location_text),
      desiredJob: normalizeText(profile.desired_job_title),
      phone: normalizeText(profile.phone_number),
      website: normalizeText(profile.personal_website),
      linkedin: normalizeText(profile.linkedin_url),
      github: normalizeText(profile.github_url),
      jobTypes,
      updatedAt: profile.updated_at,
      looking: profile.is_looking_for_job,
    };
  }, [profile]);

  const hasProfile = Boolean(profile?.id);

  const completion = useMemo(() => {
    if (!profile) return null;
    return calculateProfileCompletion(profile);
  }, [profile]);

  const entityDefinitions = useMemo(() => {
    return {
      experiences: {
        key: "experiences",
        title: "Kinh nghiệm làm việc",
        description: "Mô tả những công việc quan trọng bạn đã tham gia.",
        addLabel: "Thêm kinh nghiệm",
        empty: hasProfile ? "Chưa có kinh nghiệm nào." : "Hãy tạo hồ sơ trước.",
        disabled: !hasProfile,
        idKey: "id",
        items: profile?.experiences || [],
        fields: [
          {
            name: "company_name",
            label: "Tên công ty",
            type: "text",
            required: true,
          },
          { name: "position", label: "Vị trí", type: "text", required: true },
          {
            name: "start_date",
            label: "Ngày bắt đầu",
            type: "date",
            required: true,
          },
          { name: "end_date", label: "Ngày kết thúc", type: "date" },
          { name: "is_current", label: "Hiện tại đang làm", type: "checkbox" },
          { name: "description", label: "Mô tả chi tiết", type: "textarea" },
        ],
        initialValues: {
          company_name: "",
          position: "",
          start_date: "",
          end_date: "",
          is_current: false,
          description: "",
        },
        toForm: (item) => ({
          company_name: item?.company_name || "",
          position: item?.position || "",
          start_date: item?.start_date ? item.start_date.slice(0, 10) : "",
          end_date: item?.end_date ? item.end_date.slice(0, 10) : "",
          is_current: Boolean(item?.is_current),
          description: item?.description || "",
        }),
        toPayload: (values) => ({
          company_name: values.company_name,
          position: values.position,
          start_date: values.start_date,
          end_date: values.is_current
            ? undefined
            : values.end_date || undefined,
          is_current: Boolean(values.is_current),
          description: values.description?.trim() || undefined,
        }),
        create: (payload) => ProfileClient.experiences.create(payload),
        update: (id, payload) => ProfileClient.experiences.update(id, payload),
        delete: (id) => ProfileClient.experiences.delete(id),
        render: (item) => ({
          title: item.position,
          subtitle: item.company_name,
          meta: formatDateRange(
            item.start_date,
            item.end_date,
            item.is_current
          ),
          description: item.description,
        }),
      },
      educations: {
        key: "educations",
        title: "Học vấn",
        description: "Chia sẻ quá trình học tập và các bằng cấp.",
        addLabel: "Thêm học vấn",
        empty: hasProfile ? "Chưa có học vấn nào." : "Hãy tạo hồ sơ trước.",
        disabled: !hasProfile,
        idKey: "id",
        items: profile?.educations || [],
        fields: [
          {
            name: "school_name",
            label: "Trường / Tổ chức",
            type: "text",
            required: true,
          },
          { name: "degree", label: "Bằng cấp", type: "text" },
          { name: "field_of_study", label: "Chuyên ngành", type: "text" },
          {
            name: "start_date",
            label: "Ngày bắt đầu",
            type: "date",
            required: true,
          },
          { name: "end_date", label: "Ngày kết thúc", type: "date" },
        ],
        initialValues: {
          school_name: "",
          degree: "",
          field_of_study: "",
          start_date: "",
          end_date: "",
        },
        toForm: (item) => ({
          school_name: item?.school_name || "",
          degree: item?.degree || "",
          field_of_study: item?.field_of_study || "",
          start_date: item?.start_date ? item.start_date.slice(0, 10) : "",
          end_date: item?.end_date ? item.end_date.slice(0, 10) : "",
        }),
        toPayload: (values) => ({
          school_name: values.school_name,
          degree: values.degree?.trim() || undefined,
          field_of_study: values.field_of_study?.trim() || undefined,
          start_date: values.start_date,
          end_date: values.end_date || undefined,
        }),
        create: (payload) => ProfileClient.educations.create(payload),
        update: (id, payload) => ProfileClient.educations.update(id, payload),
        delete: (id) => ProfileClient.educations.delete(id),
        render: (item) => ({
          title: item.school_name,
          subtitle: item.degree || item.field_of_study,
          meta: formatDateRange(item.start_date, item.end_date, false),
          description: item.field_of_study
            ? `Chuyên ngành: ${item.field_of_study}`
            : "",
        }),
      },
      skills: {
        key: "skills",
        title: "Kỹ năng",
        description: "Thể hiện các kỹ năng nổi bật nhất của bạn.",
        addLabel: "Thêm kỹ năng",
        empty: hasProfile ? "Chưa có kỹ năng nào." : "Hãy tạo hồ sơ trước.",
        disabled: !hasProfile,
        idKey: "skill_id",
        items: profile?.skills || [],
        // We'll keep level/proficiency as fields but also manage skill_id via custom modal UI
        fields: [
          {
            name: "level",
            label: "Cấp độ",
            type: "select",
            options: skillLevelOptions,
          },
          {
            name: "proficiency",
            label: "Điểm thành thạo (1-5)",
            type: "number",
            min: 1,
            max: 5,
          },
        ],
        initialValues: {
          skill_id: "",
          skill_name: "",
          category: "",
          level: "",
          proficiency: "",
        },
        toForm: (item) => ({
          skill_id: item?.skill_id || item?.id || "",
          skill_name: item?.skills?.name || item?.name || "",
          category: item?.skills?.category || "",
          level: item?.level || "",
          proficiency: item?.proficiency ?? "",
        }),
        toPayload: (values) => {
          const payload = {};
          if (values.skill_id) payload.skill_id = values.skill_id;
          if (values.level) payload.level = values.level;
          if (values.proficiency !== undefined && values.proficiency !== "")
            payload.proficiency = Number(values.proficiency);
          return payload;
        },
        create: (payload) => ProfileClient.skills.create(payload),
        update: (id, payload) => ProfileClient.skills.update(id, payload),
        delete: (id) => ProfileClient.skills.delete(id),
        render: (item) => {
          // Support two shapes:
          // 1) { skill_id, level, proficiency, skills: { name, category } }
          // 2) plain skill object { id, name, slug, type, category? }
          const skillObj = item.skills || item;
          const title = skillObj?.name || "Kỹ năng";
          const rawCategory = skillObj?.category;
          const subtitle =
            typeof rawCategory === "string"
              ? rawCategory
              : (rawCategory && rawCategory.name) || "";
          const meta = [
            item.level && item.level.toUpperCase(),
            item.proficiency && `Điểm ${item.proficiency}`,
          ]
            .filter(Boolean)
            .join(" • ");
          return { title, subtitle, meta };
        },
      },
      certifications: {
        key: "certifications",
        title: "Chứng chỉ",
        description: "Giới thiệu các chứng chỉ giúp bạn nổi bật hơn.",
        addLabel: "Thêm chứng chỉ",
        empty: hasProfile ? "Chưa có chứng chỉ nào." : "Hãy tạo hồ sơ trước.",
        disabled: !hasProfile,
        idKey: "id",
        items: profile?.certifications || [],
        fields: [
          {
            name: "name",
            label: "Tên chứng chỉ",
            type: "text",
            required: true,
          },
          {
            name: "issuing_org",
            label: "Tổ chức cấp",
            type: "text",
            required: true,
          },
          { name: "credential_id", label: "Mã chứng chỉ", type: "text" },
          { name: "credential_url", label: "Liên kết", type: "text" },
          {
            name: "issue_date",
            label: "Ngày cấp",
            type: "date",
            required: true,
          },
          { name: "expiry_date", label: "Ngày hết hạn", type: "date" },
          { name: "never_expires", label: "Không hết hạn", type: "checkbox" },
          { name: "description", label: "Mô tả", type: "textarea" },
          {
            name: "skills_acquired",
            label: "Kỹ năng đạt được",
            type: "textarea",
          },
        ],
        initialValues: {
          name: "",
          issuing_org: "",
          credential_id: "",
          credential_url: "",
          issue_date: "",
          expiry_date: "",
          never_expires: false,
          description: "",
          skills_acquired: "",
        },
        toForm: (item) => ({
          name: item?.name || "",
          issuing_org: item?.issuing_org || "",
          credential_id: item?.credential_id || "",
          credential_url: item?.credential_url || "",
          issue_date: item?.issue_date ? item.issue_date.slice(0, 10) : "",
          expiry_date: item?.expiry_date ? item.expiry_date.slice(0, 10) : "",
          never_expires: Boolean(item?.never_expires),
          description: item?.description || "",
          skills_acquired: item?.skills_acquired || "",
        }),
        toPayload: (values) => ({
          name: values.name,
          issuing_org: values.issuing_org,
          credential_id: values.credential_id?.trim() || undefined,
          credential_url: values.credential_url?.trim() || undefined,
          issue_date: values.issue_date,
          expiry_date: values.never_expires
            ? undefined
            : values.expiry_date || undefined,
          never_expires: Boolean(values.never_expires),
          description: values.description?.trim() || undefined,
          skills_acquired: values.skills_acquired?.trim() || undefined,
        }),
        create: (payload) => ProfileClient.certifications.create(payload),
        update: (id, payload) =>
          ProfileClient.certifications.update(id, payload),
        delete: (id) => ProfileClient.certifications.delete(id),
        render: (item) => ({
          title: item.name,
          subtitle: item.issuing_org,
          meta: formatDateRange(
            item.issue_date,
            item.expiry_date,
            item.never_expires
          ),
          description: item.description,
        }),
      },
      awards: {
        key: "awards",
        title: "Giải thưởng",
        description: "Chia sẻ các thành tựu nổi bật của bạn.",
        addLabel: "Thêm giải thưởng",
        empty: hasProfile ? "Chưa có giải thưởng nào." : "Hãy tạo hồ sơ trước.",
        disabled: !hasProfile,
        idKey: "id",
        items: profile?.awards || [],
        fields: [
          {
            name: "title",
            label: "Tên giải thưởng",
            type: "text",
            required: true,
          },
          {
            name: "issuer",
            label: "Đơn vị trao tặng",
            type: "text",
            required: true,
          },
          { name: "date", label: "Ngày nhận", type: "date", required: true },
          {
            name: "category",
            label: "Danh mục",
            type: "select",
            options: awardCategoryOptions,
          },
          {
            name: "level",
            label: "Cấp độ",
            type: "select",
            options: awardLevelOptions,
          },
          { name: "url", label: "Liên kết", type: "text" },
          { name: "description", label: "Mô tả", type: "textarea" },
        ],
        initialValues: {
          title: "",
          issuer: "",
          date: "",
          category: "",
          level: "",
          url: "",
          description: "",
        },
        toForm: (item) => ({
          title: item?.title || "",
          issuer: item?.issuer || "",
          date: item?.date ? item.date.slice(0, 10) : "",
          category: item?.category || "",
          level: item?.level || "",
          url: item?.url || "",
          description: item?.description || "",
        }),
        toPayload: (values) => ({
          title: values.title,
          issuer: values.issuer,
          date: values.date,
          category: values.category || undefined,
          level: values.level || undefined,
          url: values.url?.trim() || undefined,
          description: values.description?.trim() || undefined,
        }),
        create: (payload) => ProfileClient.awards.create(payload),
        update: (id, payload) => ProfileClient.awards.update(id, payload),
        delete: (id) => ProfileClient.awards.delete(id),
        render: (item) => ({
          title: item.title,
          subtitle: item.issuer,
          meta: formatDate(item.date),
          description: item.description,
        }),
      },
    };
  }, [profile, hasProfile]);

  const openEntityModal = (type, record = null) => {
    const definition = entityDefinitions[type];
    if (!definition || definition.disabled) return;
    setEntityModal({ type, mode: record ? "edit" : "create", record });
    setEntityForm(
      record ? definition.toForm(record) : definition.initialValues
    );
    setEntityModalError("");
  };

  const closeEntityModal = () => {
    setEntityModal({ type: "", mode: "create", record: null });
    setEntityForm({});
    setEntityModalError("");
    setEntityModalLoading(false);
  };

  const onEntityFieldChange = (field, event) => {
    const value =
      field.type === "checkbox" ? event.target.checked : event.target.value;
    setEntityForm((prev) => ({ ...prev, [field.name]: value }));
  };

  const handleEntitySubmit = async (event) => {
    event.preventDefault();
    const definition = entityDefinitions[entityModal.type];
    if (!definition) return;
    setEntityModalLoading(true);
    setEntityModalError("");
    try {
      const payload = definition.toPayload(entityForm);
      if (entityModal.mode === "edit") {
        await definition.update(entityModal.record[definition.idKey], payload);
      } else {
        await definition.create(payload);
      }
      await loadProfile();
      closeEntityModal();
    } catch (err) {
      setEntityModalError(getErrorMessage(err, "Không thể lưu dữ liệu."));
    } finally {
      setEntityModalLoading(false);
    }
  };

  const handleEntityDelete = async (type, record) => {
    const definition = entityDefinitions[type];
    if (!definition || definition.disabled || !record) return;
    if (!window.confirm("Bạn chắc chắn muốn xóa mục này?")) return;
    try {
      await definition.delete(record[definition.idKey]);
      await loadProfile();
    } catch (err) {
      alert(getErrorMessage(err, "Không thể xóa mục này."));
    }
  };

  const onChooseAvatar = () => avatarInputRef.current?.click();

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarError("");
    setAvatarUploading(true);
    try {
      await UploadClient.uploadAvatar(file);
      await Promise.all([loadProfile(), loadUserMeta()]);
    } catch (err) {
      setAvatarError(err?.message || "Không thể tải ảnh đại diện.");
    } finally {
      setAvatarUploading(false);
      event.target.value = "";
    }
  };

  const renderJobTypeChips = (form, toggleFn) => (
    <div className="job-type-chooser">
      {jobTypeOptions.map((opt) => {
        const checked = form.desired_job_type.includes(opt.value);
        return (
          <label
            key={opt.value}
            className={`job-type-chip${checked ? " checked" : ""}`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggleFn(opt.value)}
            />
            {opt.label}
          </label>
        );
      })}
    </div>
  );

  const renderFormSections = (
    form,
    onChange,
    toggleJobType,
    toggleLooking,
    requireName,
    locationContent
  ) => {
    const sections = [
      {
        key: "basic",
        title: "Thông tin cơ bản",
        description: "Họ tên, headline và các thông tin nhận diện chính.",
        content: (
          <div className="form-grid">
            <label className="field">
              <span>Họ tên *</span>
              <input
                name="full_name"
                value={form.full_name}
                onChange={onChange}
                placeholder="Nguyễn Văn A"
                required={requireName}
              />
            </label>
            <label className="field">
              <span>Tên hiển thị</span>
              <input
                name="display_name"
                value={form.display_name}
                onChange={onChange}
                placeholder="Andy Nguyen"
              />
            </label>
            <label className="field">
              <span>Headline</span>
              <input
                name="headline"
                value={form.headline}
                onChange={onChange}
                placeholder="Senior Frontend Engineer"
              />
            </label>
            <label className="field">
              <span>Ngày sinh</span>
              <input
                type="date"
                name="date_of_birth"
                value={form.date_of_birth}
                onChange={onChange}
              />
            </label>
            <label className="field">
              <span>Giới tính</span>
              <select name="gender" value={form.gender} onChange={onChange}>
                <option value="">Chọn</option>
                {genderOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ),
      },
      {
        key: "contact",
        title: "Liên hệ",
        description: "Thông tin giúp nhà tuyển dụng dễ dàng kết nối.",
        content: (
          <div className="form-grid">
            <label className="field">
              <span>Số điện thoại</span>
              <input
                name="phone_number"
                value={form.phone_number}
                onChange={onChange}
                placeholder="+84 912 xxx xxx"
              />
            </label>
            <label className="field">
              <span>Website cá nhân</span>
              <input
                name="personal_website"
                value={form.personal_website}
                onChange={onChange}
                placeholder="https://me.com"
              />
            </label>
            <label className="field">
              <span>LinkedIn</span>
              <input
                name="linkedin_url"
                value={form.linkedin_url}
                onChange={onChange}
                placeholder="https://linkedin.com/in/..."
              />
            </label>
            <label className="field">
              <span>GitHub</span>
              <input
                name="github_url"
                value={form.github_url}
                onChange={onChange}
                placeholder="https://github.com/..."
              />
            </label>
          </div>
        ),
      },
      {
        key: "location",
        title: "Khu vực",
        description: "Nơi bạn đang sinh sống hoặc mong muốn làm việc.",
        content: locationContent,
      },
      {
        key: "experience",
        title: "Kinh nghiệm",
        description: "Tóm tắt quá trình làm việc của bạn.",
        content: (
          <div className="form-grid">
            <label className="field field-span">
              <span>Bio</span>
              <textarea
                name="bio"
                rows={4}
                value={form.bio}
                onChange={onChange}
                placeholder="Giới thiệu ngắn..."
              />
            </label>
            <label className="field">
              <span>Số năm kinh nghiệm</span>
              <input
                type="number"
                name="years_of_experience"
                min="0"
                max="50"
                value={form.years_of_experience}
                onChange={onChange}
              />
            </label>
          </div>
        ),
      },
      {
        key: "preferences",
        title: "Mong muốn công việc",
        description: "Thông tin giúp hệ thống gợi ý việc phù hợp.",
        modifier: "compact",
        content: (
          <>
            <div className="preferences-grid">
              <div className="form-grid preference-fields">
                <label className="field">
                  <span>Chức danh mong muốn</span>
                  <input
                    name="desired_job_title"
                    value={form.desired_job_title}
                    onChange={onChange}
                    placeholder="Product Designer"
                  />
                </label>
                <label className="field">
                  <span>Mức lương tối thiểu</span>
                  <input
                    type="number"
                    name="desired_salary_min"
                    min="0"
                    value={form.desired_salary_min}
                    onChange={onChange}
                    placeholder="VD: 20000000"
                  />
                </label>
                <label className="field">
                  <span>Loại tiền tệ</span>
                  <select
                    name="desired_currency"
                    value={form.desired_currency}
                    onChange={onChange}
                  >
                    {currencyOptions.map((cur) => (
                      <option key={cur} value={cur}>
                        {cur}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="preferences-secondary">
                <div className="chips-field-card">
                  <div className="field-heading">
                    <span>Loại công việc</span>
                    <p className="field-description">
                      Bạn có thể chọn nhiều loại phù hợp với mình.
                    </p>
                  </div>
                  {renderJobTypeChips(form, toggleJobType)}
                </div>
                <div className="toggle-field-card">
                  <div className="toggle-copy">
                    <span>Đang tìm kiếm cơ hội mới</span>
                    <p className="field-description">
                      Bật trạng thái này để được gợi ý và ưu tiên cao hơn.
                    </p>
                  </div>
                  <div className="toggle-control">
                    <input
                      type="checkbox"
                      checked={form.is_looking_for_job}
                      onChange={toggleLooking}
                    />
                    <span className="toggle-switch" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>
          </>
        ),
      },
    ];

    return sections.map((section) => (
      <SectionCard
        key={section.key}
        title={section.title}
        description={section.description}
        modifier={section.modifier}
      >
        {section.content}
      </SectionCard>
    ));
  };

  return (
    <>
      <section className="section profile-page">
        <div className="card profile-hero">
          <div className="profile-hero__badge">Hồ sơ ứng viên</div>
          <div className="profile-hero__content">
            <div>
              <h2 className="profile-hero__title">
                Tối ưu hồ sơ để nổi bật trước nhà tuyển dụng
              </h2>
              <p className="profile-hero__subtitle">
                Tạo hồ sơ JobFinder để ứng tuyển nhanh, theo dõi trạng thái và
                được ưu tiên trong kết quả tìm kiếm.
              </p>
            </div>
          </div>
        </div>

        {fetchError && (
          <div className="error-banner profile-banner">{fetchError}</div>
        )}

        {/* Profile Completion Indicator */}
        {profile && completion && (
          <div className="card profile-completion">
            <div className="profile-completion__header">
              <h3 className="profile-completion__title">
                Mức độ hoàn thành hồ sơ
              </h3>
              <div
                className={`profile-completion__percentage ${
                  completion.isComplete
                    ? "profile-completion__percentage--complete"
                    : ""
                }`}
              >
                {completion.percentage}%
              </div>
            </div>
            <div className="profile-completion__progress">
              <div
                className={`profile-completion__progress-bar ${
                  completion.isComplete
                    ? "profile-completion__progress-bar--complete"
                    : completion.percentage >= 50
                    ? "profile-completion__progress-bar--warning"
                    : "profile-completion__progress-bar--danger"
                }`}
                style={{ width: `${completion.percentage}%` }}
              />
            </div>
            {!completion.isComplete && completion.missingItems.length > 0 && (
              <div className="profile-completion__missing">
                <p className="profile-completion__missing-title">
                  Cần hoàn thành:
                </p>
                <ul className="profile-completion__missing-list">
                  {completion.missingItems.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {completion.isComplete && (
              <div className="profile-completion__success">
                Hồ sơ của bạn đã hoàn thành! Bạn có thể tạo CV từ hồ sơ này.
              </div>
            )}
          </div>
        )}

        <div className="profile-grid">
          <div className="card profile-form-card">
            <div className="profile-form-wrapper">
              {!profile ? (
                <form onSubmit={onCreate} className="profile-form">
                  {renderFormSections(
                    createForm,
                    handleCreateChange,
                    toggleCreateJobType,
                    handleCreateLooking,
                    true,
                    <div className="form-grid location-cascading">
                      <label className="field">
                        <span>Tỉnh/Thành phố</span>
                        {selectedProvinceCreate ? (
                          <div className="selected-location-item">
                            <span>{selectedProvinceCreate.name}</span>
                            <button
                              type="button"
                              onClick={handleClearProvinceCreate}
                              className="clear-btn"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="autocomplete-wrapper">
                            <div
                              style={{
                                display: "flex",
                                gap: 6,
                                alignItems: "center",
                              }}
                            >
                              <input
                                type="text"
                                value={provinceSearchCreate}
                                onChange={(e) => {
                                  setProvinceSearchCreate(e.target.value);
                                  setShowProvinceDropdownCreate(true);
                                }}
                                onFocus={() => {
                                  setShowProvinceDropdownCreate(true);
                                  if (
                                    !provinceSearchCreate.trim() &&
                                    initialProvinces.length > 0
                                  ) {
                                    setProvinces(initialProvinces);
                                  }
                                }}
                                onBlur={() => {
                                  setTimeout(
                                    () => setShowProvinceDropdownCreate(false),
                                    150
                                  );
                                }}
                                placeholder="Tìm kiếm tỉnh/thành phố..."
                                style={{ flex: 1 }}
                              />
                              <button
                                type="button"
                                className="btn ghost"
                                onMouseDown={(e) => {
                                  // prevent input blur before toggle
                                  e.preventDefault();
                                  // toggle dropdown and ensure provinces populated
                                  setShowProvinceDropdownCreate((s) => {
                                    const next = !s;
                                    if (
                                      next &&
                                      (!provinces || provinces.length === 0) &&
                                      initialProvinces.length > 0
                                    ) {
                                      setProvinces(initialProvinces);
                                    }
                                    return next;
                                  });
                                }}
                                aria-label="Chọn tỉnh/thành phố"
                              >
                                ▾
                              </button>
                            </div>
                            {showProvinceDropdownCreate &&
                              provinces.length > 0 && (
                                <div
                                  className="autocomplete-dropdown"
                                  onMouseDown={(e) => e.preventDefault()}
                                >
                                  {provinces.map((province) => (
                                    <div
                                      key={province.id}
                                      className="autocomplete-item"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleProvinceSelectCreate(province);
                                      }}
                                    >
                                      {province.name}
                                    </div>
                                  ))}
                                </div>
                              )}
                          </div>
                        )}
                      </label>
                      <label className="field">
                        <span>Quận/Huyện</span>
                        {selectedDistrictCreate ? (
                          <div className="selected-location-item">
                            <span>{selectedDistrictCreate.name}</span>
                            <button
                              type="button"
                              onClick={handleClearDistrictCreate}
                              className="clear-btn"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="autocomplete-wrapper">
                            <input
                              type="text"
                              value={districtSearchCreate}
                              onChange={(e) => {
                                setDistrictSearchCreate(e.target.value);
                                if (selectedProvinceCreate)
                                  setShowDistrictDropdownCreate(true);
                              }}
                              onFocus={() => {
                                if (selectedProvinceCreate) {
                                  setShowDistrictDropdownCreate(true);
                                  if (
                                    !districtSearchCreate.trim() &&
                                    initialDistrictsCreate.length > 0
                                  ) {
                                    setAvailableDistrictsCreate(
                                      initialDistrictsCreate
                                    );
                                  }
                                }
                              }}
                              onBlur={() => {
                                setTimeout(
                                  () => setShowDistrictDropdownCreate(false),
                                  150
                                );
                              }}
                              placeholder={
                                loadingDistrictsCreate
                                  ? "Đang tải..."
                                  : !selectedProvinceCreate
                                  ? "Chọn tỉnh/thành phố trước"
                                  : "Tìm kiếm quận/huyện..."
                              }
                              disabled={
                                !selectedProvinceCreate ||
                                loadingDistrictsCreate
                              }
                              title={
                                !selectedProvinceCreate
                                  ? "Chọn tỉnh/thành phố trước"
                                  : ""
                              }
                            />
                            {showDistrictDropdownCreate &&
                              selectedProvinceCreate &&
                              !loadingDistrictsCreate &&
                              availableDistrictsCreate.length > 0 && (
                                <div
                                  className="autocomplete-dropdown"
                                  onMouseDown={(e) => e.preventDefault()}
                                >
                                  {availableDistrictsCreate.map((district) => (
                                    <div
                                      key={district.id}
                                      className="autocomplete-item"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleDistrictSelectCreate(district);
                                      }}
                                    >
                                      {district.name}
                                    </div>
                                  ))}
                                </div>
                              )}
                          </div>
                        )}
                      </label>
                    </div>
                  )}
                  <StatusBanner state={createStatus} />
                  <div className="profile-actions">
                    <button
                      type="submit"
                      className="btn primary large"
                      disabled={createStatus.loading}
                    >
                      {createStatus.loading ? "Đang tạo..." : "Tạo hồ sơ"}
                    </button>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => setCreateForm(blankForm())}
                    >
                      Xóa thông tin
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={onUpdate} className="profile-form">
                  {profile ? (
                    <>
                      {renderFormSections(
                        updateForm,
                        handleUpdateChange,
                        toggleUpdateJobType,
                        handleUpdateLooking,
                        false,
                        <div className="form-grid location-cascading">
                          <label className="field">
                            <span>Tỉnh/Thành phố</span>
                            {selectedProvinceUpdate ? (
                              <div className="selected-location-item">
                                <span>{selectedProvinceUpdate.name}</span>
                                <button
                                  type="button"
                                  onClick={handleClearProvinceUpdate}
                                  className="clear-btn"
                                >
                                  ×
                                </button>
                              </div>
                            ) : (
                              <div className="autocomplete-wrapper">
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 6,
                                    alignItems: "center",
                                  }}
                                >
                                  <input
                                    type="text"
                                    value={provinceSearchUpdate}
                                    onChange={(e) => {
                                      setProvinceSearchUpdate(e.target.value);
                                      setShowProvinceDropdownUpdate(true);
                                    }}
                                    onFocus={() => {
                                      setShowProvinceDropdownUpdate(true);
                                    }}
                                    onBlur={() => {
                                      setTimeout(
                                        () =>
                                          setShowProvinceDropdownUpdate(false),
                                        150
                                      );
                                    }}
                                    placeholder="Tìm kiếm tỉnh/thành phố..."
                                    style={{ flex: 1 }}
                                  />
                                  <button
                                    type="button"
                                    className="btn ghost"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      setShowProvinceDropdownUpdate((s) => !s);
                                    }}
                                    aria-label="Chọn tỉnh/thành phố"
                                  >
                                    ▾
                                  </button>
                                </div>
                                {showProvinceDropdownUpdate &&
                                  filteredProvincesUpdate.length > 0 && (
                                    <div
                                      className="autocomplete-dropdown"
                                      onMouseDown={(e) => e.preventDefault()}
                                    >
                                      {filteredProvincesUpdate.map(
                                        (province) => (
                                          <div
                                            key={province.id}
                                            className="autocomplete-item"
                                            onMouseDown={(e) => {
                                              e.preventDefault();
                                              handleProvinceSelectUpdate(
                                                province
                                              );
                                            }}
                                          >
                                            {province.name}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                              </div>
                            )}
                          </label>
                          <label className="field">
                            <span>Quận/Huyện</span>
                            {selectedDistrictUpdate ? (
                              <div className="selected-location-item">
                                <span>{selectedDistrictUpdate.name}</span>
                                <button
                                  type="button"
                                  onClick={handleClearDistrictUpdate}
                                  className="clear-btn"
                                >
                                  ×
                                </button>
                              </div>
                            ) : (
                              <div className="autocomplete-wrapper">
                                <input
                                  type="text"
                                  value={districtSearchUpdate}
                                  onChange={(e) => {
                                    setDistrictSearchUpdate(e.target.value);
                                    if (selectedProvinceUpdate)
                                      setShowDistrictDropdownUpdate(true);
                                  }}
                                  onFocus={() => {
                                    if (selectedProvinceUpdate) {
                                      setShowDistrictDropdownUpdate(true);
                                    }
                                  }}
                                  onBlur={() => {
                                    setTimeout(
                                      () =>
                                        setShowDistrictDropdownUpdate(false),
                                      150
                                    );
                                  }}
                                  placeholder={
                                    loadingDistrictsUpdate
                                      ? "Đang tải..."
                                      : !selectedProvinceUpdate
                                      ? "Chọn tỉnh/thành phố trước"
                                      : "Tìm kiếm quận/huyện..."
                                  }
                                  disabled={
                                    !selectedProvinceUpdate ||
                                    loadingDistrictsUpdate
                                  }
                                  title={
                                    !selectedProvinceUpdate
                                      ? "Chọn tỉnh/thành phố trước"
                                      : ""
                                  }
                                />
                                {showDistrictDropdownUpdate &&
                                  selectedProvinceUpdate &&
                                  !loadingDistrictsUpdate &&
                                  filteredDistrictsUpdate.length > 0 && (
                                    <div
                                      className="autocomplete-dropdown"
                                      onMouseDown={(e) => e.preventDefault()}
                                    >
                                      {filteredDistrictsUpdate.map(
                                        (district) => (
                                          <div
                                            key={district.id}
                                            className="autocomplete-item"
                                            onMouseDown={(e) => {
                                              e.preventDefault();
                                              handleDistrictSelectUpdate(
                                                district
                                              );
                                            }}
                                          >
                                            {district.name}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                              </div>
                            )}
                          </label>
                        </div>
                      )}
                      <StatusBanner state={updateStatus} />
                      <div className="profile-actions">
                        <button
                          type="submit"
                          className="btn primary large"
                          disabled={updateStatus.loading}
                        >
                          {updateStatus.loading
                            ? "Đang lưu..."
                            : "Lưu thay đổi"}
                        </button>
                        <button
                          type="button"
                          className="btn ghost"
                          onClick={() => setUpdateForm(toFormState(profile))}
                        >
                          Khôi phục dữ liệu
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="muted empty-copy">
                      Bạn chưa có hồ sơ, hãy tạo mới trước.
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>

          <aside className="card profile-summary">
            <h3 className="profile-summary__title">Tóm tắt</h3>
            {summary ? (
              <>
                <div className="profile-summary__hero">
                  <div className="profile-summary__avatar-wrapper">
                    <div className="profile-summary__avatar">
                      {userMeta?.profile?.avatar_url ? (
                        <img
                          src={userMeta.profile.avatar_url}
                          alt={summary.name || "Avatar"}
                        />
                      ) : (
                        <span>{(summary.name || "A").charAt(0)}</span>
                      )}
                    </div>
                    <div className="profile-summary__hero-info">
                      <div className="profile-summary__badge">Ứng viên</div>
                      <div>
                        <div className="profile-summary__name">
                          {summary.name || "Chưa có tên"}
                        </div>
                        <div className="profile-summary__headline">
                          {summary.headline || "Chưa cập nhật headline"}
                        </div>
                      </div>
                      <div className="profile-summary__upload">
                        <button
                          type="button"
                          className="btn ghost"
                          onClick={onChooseAvatar}
                          disabled={avatarUploading}
                        >
                          {avatarUploading ? "Đang tải..." : "Đổi ảnh đại diện"}
                        </button>
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={handleAvatarUpload}
                        />
                        {avatarError && (
                          <span className="profile-summary__upload-error">
                            {avatarError}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="profile-summary__list">
                  <SummaryRow
                    icon="🎯"
                    label="Vị trí mong muốn"
                    value={summary.desiredJob || "Chưa có"}
                  />
                  <SummaryRow
                    icon="📍"
                    label="Khu vực"
                    value={summary.location || "Chưa có"}
                  />
                  <SummaryRow
                    icon="📞"
                    label="Điện thoại"
                    value={summary.phone || "Chưa cập nhật"}
                  />
                  <SummaryRow
                    icon="🌐"
                    label="Website"
                    value={summary.website || "-"}
                  />
                  <SummaryRow
                    icon="in"
                    label="LinkedIn"
                    value={summary.linkedin || "-"}
                  />
                  <SummaryRow
                    icon="🐙"
                    label="GitHub"
                    value={summary.github || "-"}
                  />
                  <SummaryRow
                    icon="💼"
                    label="Loại công việc"
                    value={
                      summary.jobTypes.length ? (
                        <div className="profile-summary__chips">
                          {summary.jobTypes.map((type) => (
                            <span key={type} className="summary-chip">
                              {type}
                            </span>
                          ))}
                        </div>
                      ) : (
                        "Chưa chọn"
                      )
                    }
                  />
                  <SummaryRow
                    icon="📣"
                    label="Trạng thái tìm việc"
                    value={
                      <span
                        className={`summary-chip ${
                          summary.looking ? "active" : "inactive"
                        }`}
                      >
                        {summary.looking ? "Đang tìm việc" : "Không tìm việc"}
                      </span>
                    }
                  />
                </div>
                <div className="profile-summary__footer">
                  {summary.updatedAt
                    ? `Cập nhật lần cuối: ${new Date(
                        summary.updatedAt
                      ).toLocaleString("vi-VN")}`
                    : "Chưa từng cập nhật"}
                </div>
              </>
            ) : (
              <div className="muted">
                Hồ sơ chưa sẵn sàng. Hãy tạo hồ sơ để JobFinder gợi ý việc làm
                tốt hơn.
              </div>
            )}
          </aside>
        </div>

        <div className="profile-entities">
          {Object.entries(entityDefinitions).map(([key, definition]) => (
            <ProfileEntitySection
              key={key}
              definition={definition}
              onAdd={() => openEntityModal(key)}
              onEdit={(item) => openEntityModal(key, item)}
              onDelete={(item) => handleEntityDelete(key, item)}
            />
          ))}
        </div>
      </section>

      <SimpleModal open={Boolean(entityModal.type)} onClose={closeEntityModal}>
        {entityModal.type && (
          <form className="entity-form" onSubmit={handleEntitySubmit}>
            <h3 style={{ marginTop: 0 }}>
              {entityModal.mode === "edit" ? "Chỉnh sửa" : "Thêm mới"}{" "}
              {entityDefinitions[entityModal.type]?.title.toLowerCase()}
            </h3>
            <p className="muted small" style={{ marginBottom: 16 }}>
              {entityDefinitions[entityModal.type]?.description}
            </p>
            <div className="entity-form__grid">
              {entityModal.type === "skills" ? (
                <>
                  <label className="entity-field">
                    <span>Danh mục kỹ năng</span>
                    <select
                      name="category"
                      value={entityForm.category || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEntityForm((prev) => ({
                          ...prev,
                          category: val,
                          skill_id: "",
                          skill_name: "",
                        }));
                        fetchSkillsForCategory(val);
                      }}
                      required
                    >
                      <option value="">Chọn danh mục...</option>
                      {skillCategories.map((cat, i) => (
                        <option key={i} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="entity-field">
                    <span>Kỹ năng</span>
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        value={skillSearch || entityForm.skill_name || ""}
                        onChange={(e) => {
                          const q = e.target.value;
                          setSkillSearch(q);
                          setShowSkillDropdown(true);
                          if (!q.trim()) {
                            setAvailableSkills(initialAvailableSkills);
                          } else {
                            setAvailableSkills(
                              initialAvailableSkills.filter((s) =>
                                s.name.toLowerCase().includes(q.toLowerCase())
                              )
                            );
                          }
                        }}
                        onFocus={() => {
                          if (!entityForm.category) return;
                          setShowSkillDropdown(true);
                          if (
                            !skillSearch.trim() &&
                            initialAvailableSkills.length > 0
                          ) {
                            setAvailableSkills(initialAvailableSkills);
                          }
                        }}
                        onBlur={() =>
                          setTimeout(() => setShowSkillDropdown(false), 150)
                        }
                        placeholder={
                          loadingSkills
                            ? "Đang tải..."
                            : !entityForm.category
                            ? "Chọn danh mục trước"
                            : "Tìm hoặc chọn kỹ năng..."
                        }
                        disabled={!entityForm.category || loadingSkills}
                        required
                      />
                      {showSkillDropdown &&
                        entityForm.category &&
                        !loadingSkills &&
                        availableSkills.length > 0 && (
                          <div
                            className="autocomplete-dropdown"
                            style={{ position: "absolute", zIndex: 30 }}
                            onMouseDown={(e) => e.preventDefault()}
                          >
                            {availableSkills.map((s) => (
                              <div
                                key={s.id}
                                className="autocomplete-item"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setEntityForm((prev) => ({
                                    ...prev,
                                    skill_id: s.id,
                                    skill_name: s.name,
                                  }));
                                  setSkillSearch(s.name);
                                  setShowSkillDropdown(false);
                                }}
                              >
                                {s.name}
                                {s.category ? ` (${s.category})` : ""}
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </label>

                  <label className="entity-field">
                    <span>Độ thành thạo (1-5)</span>
                    <input
                      type="number"
                      name="proficiency"
                      min="1"
                      max="5"
                      value={entityForm.proficiency ?? ""}
                      onChange={(e) =>
                        setEntityForm((prev) => ({
                          ...prev,
                          proficiency: e.target.value
                            ? Number(e.target.value)
                            : "",
                        }))
                      }
                      required
                    />
                    <small className="muted">1 (thấp) - 5 (cao)</small>
                  </label>

                  <label className="entity-field">
                    <span>Cấp độ</span>
                    <select
                      name="level"
                      value={entityForm.level || ""}
                      onChange={(e) =>
                        setEntityForm((prev) => ({
                          ...prev,
                          level: e.target.value,
                        }))
                      }
                    >
                      <option value="">Chọn cấp độ</option>
                      {skillLevelOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              ) : (
                entityDefinitions[entityModal.type]?.fields.map((field) => {
                  const value =
                    entityForm[field.name] ??
                    (field.type === "checkbox" ? false : "");
                  const disabled =
                    (field.disableOnEdit && entityModal.mode === "edit") ||
                    (field.name === "expiry_date" && entityForm.never_expires);
                  if (field.type === "textarea") {
                    return (
                      <label key={field.name} className="entity-field">
                        <span>{field.label}</span>
                        <textarea
                          name={field.name}
                          rows={4}
                          value={value}
                          onChange={(e) => onEntityFieldChange(field, e)}
                          placeholder={field.placeholder}
                          disabled={disabled}
                          required={field.required}
                        />
                      </label>
                    );
                  }
                  if (field.type === "select") {
                    return (
                      <label key={field.name} className="entity-field">
                        <span>{field.label}</span>
                        <select
                          name={field.name}
                          value={value}
                          onChange={(e) => onEntityFieldChange(field, e)}
                          disabled={disabled}
                          required={field.required}
                        >
                          <option value="">Chọn</option>
                          {(field.options || []).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  }
                  if (field.type === "checkbox") {
                    return (
                      <label
                        key={field.name}
                        className="entity-field checkbox-field"
                      >
                        <input
                          type="checkbox"
                          name={field.name}
                          checked={Boolean(value)}
                          onChange={(e) => onEntityFieldChange(field, e)}
                          disabled={disabled}
                        />
                        <span>{field.label}</span>
                      </label>
                    );
                  }
                  return (
                    <label key={field.name} className="entity-field">
                      <span>{field.label}</span>
                      <input
                        type={field.type || "text"}
                        name={field.name}
                        value={value}
                        onChange={(e) => onEntityFieldChange(field, e)}
                        placeholder={field.placeholder}
                        disabled={disabled}
                        required={field.required}
                        min={field.min}
                        max={field.max}
                      />
                    </label>
                  );
                })
              )}
            </div>
            {entityModalError && (
              <div className="error-banner">{entityModalError}</div>
            )}
            <div className="modal-actions">
              <button type="button" className="btn" onClick={closeEntityModal}>
                Hủy
              </button>
              <button
                type="submit"
                className="btn primary"
                disabled={entityModalLoading}
              >
                {entityModalLoading ? "Đang lưu..." : "Lưu thông tin"}
              </button>
            </div>
          </form>
        )}
      </SimpleModal>
    </>
  );
}

function SummaryRow({ icon, label, value }) {
  return (
    <div className="summary-row">
      <div className="summary-row__icon">{icon}</div>
      <div className="summary-row__body">
        <div className="summary-row__label">{label}</div>
        <div className="summary-row__value">{value}</div>
      </div>
    </div>
  );
}

function StatusBanner({ state }) {
  if (!state?.error && !state?.message) return null;
  const text = state.error || state.message;
  const cls = state.error ? "error-banner" : "success-banner";
  return <div className={`${cls} profile-banner`}>{text}</div>;
}

function SectionCard({ title, description, children, modifier }) {
  return (
    <div
      className={`profile-section-card${
        modifier ? ` profile-section-card--${modifier}` : ""
      }`}
    >
      <div className="profile-section-card__head">
        <div>
          <div className="profile-section-card__title">{title}</div>
          {description && <p className="muted small">{description}</p>}
        </div>
      </div>
      <div className="profile-section-card__body">{children}</div>
    </div>
  );
}

function ProfileEntitySection({ definition, onAdd, onEdit, onDelete }) {
  return (
    <div className="profile-entity card">
      <div className="profile-entity__head">
        <div>
          <h3>{definition.title}</h3>
          <p className="muted small">{definition.description}</p>
        </div>
        <button
          className="btn ghost"
          onClick={onAdd}
          disabled={definition.disabled}
        >
          {definition.addLabel}
        </button>
      </div>
      {definition.items.length ? (
        <div className="profile-entity__list">
          {definition.items.map((item) => {
            const rendered = definition.render(item);
            const itemKey = item[definition.idKey] ?? item.id;
            return (
              <article key={itemKey} className="profile-entity__item">
                <div>
                  <div className="profile-entity__title">
                    {rendered.title || "-"}
                  </div>
                  {rendered.subtitle && (
                    <div className="profile-entity__subtitle">
                      {rendered.subtitle}
                    </div>
                  )}
                  {rendered.meta && (
                    <div className="profile-entity__meta">{rendered.meta}</div>
                  )}
                  {rendered.description && (
                    <p className="profile-entity__description">
                      {rendered.description}
                    </p>
                  )}
                </div>
                <div className="profile-entity__actions">
                  <button className="btn ghost" onClick={() => onEdit(item)}>
                    Chỉnh sửa
                  </button>
                  <button className="btn danger" onClick={() => onDelete(item)}>
                    Xóa
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-copy">{definition.empty}</div>
      )}
    </div>
  );
}
