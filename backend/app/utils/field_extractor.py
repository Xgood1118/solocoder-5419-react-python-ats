import re
from typing import List, Tuple
from app.models import (
    ResumeParsedResult, Education, WorkExperience, ProjectExperience,
)


SKILL_KEYWORDS = [
    "Java", "Python", "C++", "C#", "JavaScript", "TypeScript", "Go", "Rust",
    "React", "Vue", "Angular", "Node.js", "Next.js", "Nuxt.js",
    "Spring", "Spring Boot", "Django", "Flask", "FastAPI", "Express",
    "MySQL", "PostgreSQL", "MongoDB", "Redis", "Oracle", "SQL Server",
    "Docker", "Kubernetes", "K8s", "AWS", "阿里云", "腾讯云",
    "Git", "Linux", "Nginx", "Tomcat",
    "TensorFlow", "PyTorch", "机器学习", "深度学习", "AI", "NLP", "CV",
    "微服务", "分布式", "高并发", "系统设计",
    "产品经理", "运营", "市场", "销售", "HR", "财务",
    "Excel", "PPT", "Word", "数据结构", "算法",
    "SQL", "NoSQL", "Elasticsearch", "Kafka", "RabbitMQ",
    "HTML", "CSS", "Sass", "Less", "Webpack", "Vite",
    "iOS", "Android", "Flutter", "React Native",
    "测试", "自动化测试", "性能测试", "安全测试",
    "UI设计", "UX设计", "Figma", "Sketch", "Photoshop", "Illustrator",
]

SECTION_KEYWORDS = [
    "教育背景", "教育经历", "教育", "学历", "求学经历",
    "工作经历", "工作经验", "职业经历", "工作背景", "工作履历",
    "项目经历", "项目经验", "项目",
    "技能", "专业技能", "技术栈", "技术能力", "掌握技能", "技能特长",
    "自我评价", "自我简介", "个人简介", "自我介绍", "个人评价",
    "实习经历", "校园经历", "校园活动", "获奖经历", "证书",
    "兴趣爱好", "语言能力", "其他",
]

NAME_FORBIDDEN_WORDS = [
    "教育", "工作", "项目", "技能", "自我", "个人", "实习",
    "校园", "获奖", "证书", "兴趣", "语言", "其他", "求职",
    "基本", "联系", "信息", "背景", "经历", "经验", "简介",
    "介绍", "评价", "能力", "特长", "爱好", "公司", "大学",
    "学院", "专业", "职责", "负责", "技术", "部门", "职位",
]


class FieldExtractor:
    def __init__(self, text: str):
        self.text = text
        self.lines = [line.strip() for line in text.split("\n") if line.strip()]
        self.sections = self._split_sections()

    def _is_section_header(self, line: str) -> bool:
        if len(line) > 20:
            return False
        for kw in SECTION_KEYWORDS:
            if line == kw or (kw in line and len(line) - len(kw) < 4):
                return True
        return False

    def _split_sections(self) -> dict:
        sections = {"header": [], "education": [], "work": [], "project": [],
                    "skill": [], "self_eval": [], "other": []}
        current_section = "header"

        for line in self.lines:
            if self._is_section_header(line):
                line_lower = line
                if any(kw in line for kw in ["教育背景", "教育经历", "教育", "学历", "求学经历"]):
                    current_section = "education"
                elif any(kw in line for kw in ["工作经历", "工作经验", "职业经历", "工作背景", "工作履历"]):
                    current_section = "work"
                elif any(kw in line for kw in ["项目经历", "项目经验"]) and "工作" not in line:
                    current_section = "project"
                elif any(kw in line for kw in ["技能", "专业技能", "技术栈", "技术能力", "掌握技能", "技能特长"]):
                    current_section = "skill"
                elif any(kw in line for kw in ["自我评价", "自我简介", "个人简介", "自我介绍", "个人评价"]):
                    current_section = "self_eval"
                else:
                    current_section = "other"
                continue

            if current_section in sections:
                sections[current_section].append(line)
            else:
                sections["other"].append(line)

        return sections

    def extract_name(self) -> str:
        header_lines = self.sections["header"]

        for line in header_lines[:8]:
            if "姓名" in line:
                match = re.search(r"姓名[:：\s]*([\u4e00-\u9fa5]{2,4}|[a-zA-Z\s]{2,30})", line)
                if match:
                    name = match.group(1).strip()
                    if name and len(name) >= 2:
                        return name

        for line in header_lines[:8]:
            if len(line) <= 4 and re.match(r"^[\u4e00-\u9fa5]{2,4}$", line):
                is_valid_name = True
                for fw in NAME_FORBIDDEN_WORDS:
                    if fw in line:
                        is_valid_name = False
                        break
                if is_valid_name and not self._is_section_header(line):
                    return line

        for line in header_lines[:12]:
            match = re.search(r"^([\u4e00-\u9fa5]{2,4})\s*[|｜/／]", line)
            if match:
                name = match.group(1).strip()
                is_valid_name = True
                for fw in NAME_FORBIDDEN_WORDS:
                    if fw in name:
                        is_valid_name = False
                        break
                if is_valid_name:
                    return name

        return ""

    def extract_phone(self) -> str:
        pattern = r"1[3-9]\d{9}"
        match = re.search(pattern, self.text)
        if match:
            return match.group(0)
        return ""

    def extract_email(self) -> str:
        pattern = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
        match = re.search(pattern, self.text)
        if match:
            return match.group(0)
        return ""

    def extract_education(self) -> List[Education]:
        educations = []
        lines = self.sections["education"]
        degree_keywords = ["博士", "硕士", "本科", "专科", "高中", "大专", "学士", "MBA", "研究生"]

        if not lines:
            return educations

        current_edu = None
        date_pattern = r"(\d{4})[.\-/年](\d{1,2})[.\-/月]?\s*[-至~到]\s*(\d{4}|至今)?[.\-/年]?(\d{1,2})?[.\-/月]?"

        for line in lines:
            date_match = re.search(date_pattern, line)
            if date_match:
                if current_edu and (current_edu.school or current_edu.degree):
                    educations.append(current_edu)
                current_edu = Education()

                start_y = date_match.group(1)
                start_m = date_match.group(2)
                current_edu.start_date = f"{start_y}-{start_m.zfill(2) if start_m else '01'}"

                end_val = date_match.group(3)
                if end_val:
                    if end_val == "至今":
                        current_edu.end_date = "至今"
                    else:
                        end_m = date_match.group(4) or "06"
                        current_edu.end_date = f"{end_val}-{end_m.zfill(2)}"

                school_match = re.search(r"([\u4e00-\u9fa5a-zA-Z0-9]+(大学|学院|学校|研究院|研究所))", line)
                if school_match:
                    current_edu.school = school_match.group(1)

                for deg in degree_keywords:
                    if deg in line:
                        current_edu.degree = deg
                        break

                major_match = re.search(r"([\u4e00-\u9fa5a-zA-Z]+专业)", line)
                if major_match:
                    current_edu.major = major_match.group(1)
                else:
                    parts = re.split(r"[\s·]+", line)
                    for part in parts:
                        if "专业" in part and len(part) <= 20:
                            current_edu.major = part.strip()
                            break

            elif current_edu is not None:
                if not current_edu.school:
                    school_match = re.search(r"([\u4e00-\u9fa5a-zA-Z0-9]+(大学|学院|学校|研究院|研究所))", line)
                    if school_match:
                        current_edu.school = school_match.group(1)

                if not current_edu.degree:
                    for deg in degree_keywords:
                        if deg in line:
                            current_edu.degree = deg
                            break

                if not current_edu.major and "专业" in line:
                    major_match = re.search(r"([\u4e00-\u9fa5a-zA-Z]+专业)", line)
                    if major_match:
                        current_edu.major = major_match.group(1)

        if current_edu and (current_edu.school or current_edu.degree):
            educations.append(current_edu)

        if not educations:
            for deg in degree_keywords:
                if deg in self.text:
                    edu = Education(degree=deg)
                    school_match = re.search(r"([\u4e00-\u9fa5a-zA-Z0-9]+(大学|学院))", self.text)
                    if school_match:
                        edu.school = school_match.group(1)
                    educations.append(edu)
                    break

        return educations

    def extract_work_experience(self) -> List[WorkExperience]:
        experiences = []
        lines = self.sections["work"]

        if not lines:
            return experiences

        current_exp = None
        date_pattern = r"(\d{4})[.\-/年](\d{1,2})[.\-/月]?\s*[-至~到]\s*(\d{4}|至今)?[.\-/年]?(\d{1,2})?[.\-/月]?"

        for line in lines:
            date_match = re.search(date_pattern, line)
            if date_match:
                if current_exp and (current_exp.company or current_exp.position):
                    experiences.append(current_exp)
                current_exp = WorkExperience()

                start_y = date_match.group(1)
                start_m = date_match.group(2)
                current_exp.start_date = f"{start_y}-{start_m.zfill(2) if start_m else '01'}"

                end_val = date_match.group(3)
                if end_val == "至今":
                    current_exp.end_date = "至今"
                elif end_val:
                    end_m = date_match.group(4) or "01"
                    current_exp.end_date = f"{end_val}-{end_m.zfill(2)}"
                else:
                    current_exp.end_date = "至今"

                company_match = re.search(
                    r"([\u4e00-\u9fa5a-zA-Z0-9\s]+(公司|科技|集团|企业|有限公司|股份|研究院))",
                    line
                )
                if not company_match:
                    company_match = re.search(r"^([\u4e00-\u9fa5a-zA-Z0-9\s]{2,20})", line)
                if company_match:
                    current_exp.company = company_match.group(1).strip()

                pos_patterns = [
                    r"([\u4e00-\u9fa5a-zA-Z]+工程师)",
                    r"([\u4e00-\u9fa5a-zA-Z]+经理)",
                    r"([\u4e00-\u9fa5a-zA-Z]+主管)",
                    r"([\u4e00-\u9fa5a-zA-Z]+总监)",
                    r"([\u4e00-\u9fa5a-zA-Z]+专家)",
                    r"([\u4e00-\u9fa5a-zA-Z]+设计师)",
                    r"([\u4e00-\u9fa5a-zA-Z]+分析师)",
                    r"[\s·/／|｜]([\u4e00-\u9fa5a-zA-Z]{2,15})$",
                ]
                for pat in pos_patterns:
                    pos_match = re.search(pat, line)
                    if pos_match and pos_match.group(1) != current_exp.company:
                        current_exp.position = pos_match.group(1).strip()
                        break

            elif current_exp is not None:
                if current_exp.description:
                    current_exp.description += "\n" + line
                else:
                    current_exp.description = line

        if current_exp and (current_exp.company or current_exp.position):
            experiences.append(current_exp)

        return experiences

    def extract_project_experience(self) -> List[ProjectExperience]:
        projects = []
        lines = self.sections["project"]

        if not lines:
            return projects

        current_proj = None
        date_pattern = r"(\d{4})[.\-/年](\d{1,2})[.\-/月]?\s*[-至~到]\s*(\d{4}|至今)?[.\-/年]?(\d{1,2})?[.\-/月]?"

        for line in lines:
            date_match = re.search(date_pattern, line)
            if date_match:
                if current_proj and current_proj.name:
                    projects.append(current_proj)
                current_proj = ProjectExperience()

                name_part = line
                for sep in ["-", "—", "至", "到", "20"]:
                    idx = line.find(sep)
                    if idx > 0:
                        name_part = line[:idx].strip()
                        break

                name_match = re.search(r"^([\u4e00-\u9fa5a-zA-Z0-9\s]{2,30})", name_part)
                if name_match:
                    current_proj.name = name_match.group(1).strip()
                else:
                    current_proj.name = "未命名项目"

                start_y = date_match.group(1)
                start_m = date_match.group(2)
                current_proj.start_date = f"{start_y}-{start_m.zfill(2) if start_m else '01'}"

                end_val = date_match.group(3)
                if end_val == "至今":
                    current_proj.end_date = "至今"
                elif end_val:
                    end_m = date_match.group(4) or "01"
                    current_proj.end_date = f"{end_val}-{end_m.zfill(2)}"

            elif current_proj is not None:
                if "技术栈" in line or "技术" in line:
                    tech_match = re.search(r"[:：]\s*(.*)", line)
                    if tech_match:
                        current_proj.tech_stack = tech_match.group(1).strip()
                elif "职责" in line or "负责" in line or "描述" in line:
                    resp_match = re.search(r"[:：]\s*(.*)", line)
                    if resp_match:
                        current_proj.responsibilities = resp_match.group(1).strip()
                    else:
                        if current_proj.responsibilities:
                            current_proj.responsibilities += "\n" + line
                        else:
                            current_proj.responsibilities = line
                elif current_proj.responsibilities:
                    current_proj.responsibilities += "\n" + line
                elif not current_proj.name:
                    current_proj.name = line

        if current_proj and current_proj.name:
            projects.append(current_proj)

        return projects

    def extract_skills(self) -> List[str]:
        found_skills = []
        text_lower = self.text.lower()

        for skill in SKILL_KEYWORDS:
            if skill.lower() in text_lower and skill not in found_skills:
                found_skills.append(skill)

        skill_lines = self.sections["skill"]
        for line in skill_lines:
            if ":" in line or "：" in line:
                parts = re.split(r"[:：]", line, maxsplit=1)
                content = parts[1] if len(parts) > 1 else line
            else:
                content = line

            parts = re.split(r"[，,、/／；;|｜\s]+", content)
            for part in parts:
                part = part.strip()
                if 1 < len(part) < 20 and part not in found_skills and not self._is_section_header(part):
                    found_skills.append(part)

        return found_skills[:30]

    def extract_self_evaluation(self) -> str:
        lines = self.sections["self_eval"]
        if lines:
            return "\n".join(lines).strip()
        return ""

    def extract_all(self) -> ResumeParsedResult:
        return ResumeParsedResult(
            name=self.extract_name(),
            phone=self.extract_phone(),
            email=self.extract_email(),
            education=self.extract_education(),
            work_experience=self.extract_work_experience(),
            project_experience=self.extract_project_experience(),
            skills=self.extract_skills(),
            self_evaluation=self.extract_self_evaluation(),
            raw_text=self.text,
        )
