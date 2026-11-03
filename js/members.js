/* =========================================================
   멤버 데이터
   - 멤버 1명 = 객체 1개. 새 멤버는 MEMBERS 배열에 객체를 추가하면 됩니다.
   - group: "faculty" | "phd" | "ms" | "undergrad" | "alumni"
   - 비어 있는 항목은 [] 로 두면 화면에서 자동으로 숨겨집니다.
   - authors 안에서 본인 이름(nameEn 또는 citeName)은 자동으로 굵게 표시됩니다.
   ========================================================= */

const MEMBER_GROUPS = [
  { key: "faculty",   title: "Faculty",               ko: "지도교수" },
  { key: "phd",       title: "Ph.D. Students",        ko: "박사과정" },
  { key: "ms",        title: "M.S. Students",         ko: "석사과정" },
  { key: "undergrad", title: "Undergraduate Interns", ko: "학부연구생" },
  { key: "alumni",    title: "Alumni",                ko: "졸업생" },
];

const MEMBERS = [
  {
    id: "yeonsu-park",
    group: "ms",
    position: "M.S. Student",
    nameKo: "박연수",
    nameEn: "Yeon Su Park",
    citeName: ["Yeon Su Park", "Park, Yeon Su"],   // 논문 저자 표기 (굵게 표시용)
    photo: "images/members/yeonsu-park.jpg",
    department: {
      ko: "데이터공학과",
      en: "Department of Data Engineering",
    },
    interests: ["Medical Foundation Model", "Generative AI", "XAI"],
    email: ["202130422@office.pknu.ac.kr", "parkite576@gmail.com"],
    links: {},   // 예: { github: "https://github.com/...", scholar: "https://scholar.google.com/..." }

    awards: [
      { title: "석사우수장학금 (이공계)", year: "" },
    ],

    journals: {
      SCIE: [
        {
          authors: "Yeon Su Park, Ji Hye Won",
          title: "2.5D Context Encoding with Latent-Space Variational Diffusion for CBCT-to-CT Synthesis",
          venue: "MDPI Electronics",
          year: 2026,
          note: "IF=2.6, Q2, Accepted",
        },
      ],
      Scopus: [
        {
          authors: "Park, Yeon Su, and Ji Hye Won",
          title: "A Comprehensive Approach to Diabetic Retinopathy Classification: Combining ResNet34 with Enhanced Preprocessing for Ultra-widefield Fundus Imaging",
          venue: "MICCAI Challenge on Ultra-Widefield Fundus Imaging for Diabetic Retinopathy. Cham: Springer Nature Switzerland",
          year: 2024,
          note: "pp. 101-109",
        },
      ],
    },

    conferences: {
      International: [
        {
          authors: "Yeon Su Park, Hweseong Yoon, Ji Hye Won",
          title: "Probing Self-Supervised Chest Radiograph Representations via a Representation Conditional Diffusion Model",
          venue: "APCMBE Fall, Daegu, Korea",
          year: 2026,
          note: "Poster",
        },
      ],
      Domestic: [
        {
          authors: "Yeon Su Park, Ji Hye Won",
          title: "Comparison of Vision Transformer Pre-training Strategies for Novel Disease Classification on Chest X-Ray in Low-Label Settings",
          venue: "KOSOMBE Spring, Jeju, Korea",
          year: 2026,
          note: "Poster",
        },
        {
          authors: "Yeon Su Park et al.",
          title: "Classification of Positive-Negative Personality Types Using Deep Neural Networks",
          venue: "KOSOMBE Fall, Seoul, Korea",
          year: 2023,
          note: "Poster",
        },
      ],
    },
  },

  /* ---- 새 멤버 추가 예시 (복사해서 사용) ----
  {
    id: "gildong-hong",
    group: "phd",
    position: "Ph.D. Student",
    nameKo: "홍길동",
    nameEn: "Gil Dong Hong",
    citeName: ["Gil Dong Hong"],
    photo: "images/members/gildong-hong.jpg",
    department: { ko: "데이터공학과", en: "Department of Data Engineering" },
    interests: [],
    email: [],
    links: {},
    awards: [],
    journals: { SCIE: [], Scopus: [] },
    conferences: { International: [], Domestic: [] },
  },
  */
];
