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


class FieldExtractor:
    def __init__(self, text: str):
        self.text = text
        self.lines = [line.strip() for line in text.split("\n") if line.strip()]

    def extract_name(self) -> str:
        common_names = ["张三", "李四", "王五", "赵六", "钱七", "孙八", "周九", "吴十"]
        for line in self.lines[:10]:
            if len(line) <= 4 and re.match(r"^[\u4e00-\u9fa5]{2,4}$", line):
                if line not in ["姓名", "电话", "邮箱", "学历", "工作", "项目", "技能", "自我"]:
                    return line
        for line in self.lines[:5]:
            if "姓名" in line:
                match = re.search(r"姓名[:：\s]*([\u4e00-\u9fa5]{2,4})", line)
                if match:
                    return match.group(1)
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
        edu_keywords = ["教育背景", "教育经历", "教育", "学历", "求学经历"]
        degree_keywords = ["博士", "硕士", "本科", "专科", "高中", "大专", "学士", "MBA"]

        edu_start = -1
        for i, line in enumerate(self.lines):
            for kw in edu_keywords:
                if kw in line and len(line) < 20:
                    edu_start = i + 1
                    break
            if edu_start > 0:
                break

        if edu_start > 0:
            current_edu = Education()
            i = edu_start
            while i < len(self.lines):
                line = self.lines[i]
                if any(kw in line for kw in ["工作经历", "项目经历", "技能", "自我评价", "实习经历", "校园经历"]):
                    if current_edu.school or current_edu.degree:
                        educations.append(current_edu)
                    break

                date_match = re.search(r"(\d{4})[.\-/年](\d{1,2})[.\-/月]?\s*[-至~到]\s*(\d{4})?[.\-/年]?(\d{1,2})?[.\-/月]?", line)
                if date_match:
                    if current_edu.school or current_edu.degree:
                        educations.append(current_edu)
                    current_edu = Education()
                    start_y, start_m = date_match.group(1), date_match.group(2)
                    current_edu.start_date = f"{start_y}-{start_m.zfill(2)}"
                    if date_match.group(3):
                        end_y = date_match.group(3)
                        end_m = date_match.group(4) or "06"
                        current_edu.end_date = f"{end_y}-{end_m.zfill(2)}"
                    else:
                        current_edu.end_date = "至今"

                for deg in degree_keywords:
                    if deg in line and deg not in current_edu.degree:
                        current_edu.degree = deg
                        break

                if "大学" in line or "学院" in line or "学校" in line or "研究院" in line:
                    school_match = re.search(r"([\u4e00-\u9fa5]+(大学|学院|学校|研究院))", line)
                    if school_match:
                        current_edu.school = school_match.group(1)

                if "专业" in line:
                    major_match = re.search(r"([\u4e00-\u9fa5a-zA-Z\s]+专业)", line)
                    if major_match:
                        current_edu.major = major_match.group(1).strip()

                i += 1

            if current_edu.school or current_edu.degree:
                educations.append(current_edu)

        if not educations:
            for deg in degree_keywords:
                if deg in self.text:
                    edu = Education(degree=deg)
                    school_match = re.search(r"([\u4e00-\u9fa5]+(大学|学院))", self.text)
                    if school_match:
                        edu.school = school_match.group(1)
                    educations.append(edu)
                    break

        return educations

    def extract_work_experience(self) -> List[WorkExperience]:
        experiences = []
        section_starts = []
        for i, line in enumerate(self.lines):
            if any(kw in line for kw in ["工作经历", "工作经验", "职业经历", "工作背景"]) and len(line) < 20:
                section_starts.append(i + 1)
                break

        if not section_starts:
            return experiences

        start_idx = section_starts[0]
        current_exp = None
        i = start_idx

        while i < len(self.lines):
            line = self.lines[i]
            if any(kw in line for kw in ["项目经历", "技能", "自我评价", "教育背景", "校园经历", "实习经历"]):
                if current_exp:
                    experiences.append(current_exp)
                break

            date_patterns = [
                r"(\d{4})[.\-/年](\d{1,2})[.\-/月]?\s*[-至~到]\s*(\d{4})?[.\-/年]?(\d{1,2})?[.\-/月]?",
                r"(\d{4})\s*[-至~到]\s*(\d{4}|至今)",
            ]

            has_date = False
            for pattern in date_patterns:
                date_match = re.search(pattern, line)
                if date_match:
                    has_date = True
                    if current_exp and (current_exp.company or current_exp.position):
                        experiences.append(current_exp)
                    current_exp = WorkExperience()

                    start_y, start_m = date_match.group(1), date_match.group(2) if date_match.lastindex >= 2 else None
                    current_exp.start_date = f"{start_y}-{start_m.zfill(2) if start_m else '01'}"

                    if date_match.lastindex >= 3 and date_match.group(3):
                        end_y = date_match.group(3)
                        if end_y == "至今":
                            current_exp.end_date = "至今"
                        else:
                            end_m = date_match.group(4) if date_match.lastindex >= 4 and date_match.group(4) else "01"
                            current_exp.end_date = f"{end_y}-{end_m.zfill(2)}"
                    else:
                        current_exp.end_date = "至今"
                    break

            if has_date:
                company_match = re.search(r"([\u4e00-\u9fa5a-zA-Z0-9\s]+公司|[\u4e00-\u9fa5a-zA-Z0-9\s]+科技|[\u4e00-\u9fa5a-zA-Z0-9\s]+集团)", line)
                if not company_match:
                    company_match = re.search(r"^([\u4e00-\u9fa5a-zA-Z0-9\s]{2,20})", line)
                if company_match and current_exp:
                    current_exp.company = company_match.group(1).strip()

                pos_match = re.search(r"([\u4e00-\u9fa5a-zA-Z\s]+工程师|[\u4e00-\u9fa5a-zA-Z\s]+经理|[\u4e00-\u9fa5a-zA-Z\s]+主管|[\u4e00-\u9fa5a-zA-Z\s]+总监|[\u4e00-\u9fa5a-zA-Z\s]+专家)", line)
                if not pos_match:
                    pos_match = re.search(r"[，,/、\s]([\u4e00-\u9fa5a-zA-Z\s]{2,15})$", line)
                if pos_match and current_exp:
                    current_exp.position = pos_match.group(1).strip()

            elif current_exp:
                if current_exp.description:
                    current_exp.description += "\n" + line
                else:
                    current_exp.description = line

            i += 1

        if current_exp and (current_exp.company or current_exp.position):
            experiences.append(current_exp)

        return experiences

    def extract_project_experience(self) -> List[ProjectExperience]:
        projects = []
        section_start = -1
        for i, line in enumerate(self.lines):
            if any(kw in line for kw in ["项目经历", "项目经验", "项目"]) and len(line) < 20:
                section_start = i + 1
                break

        if section_start < 0:
            return projects

        current_proj = None
        i = section_start

        while i < len(self.lines):
            line = self.lines[i]
            if any(kw in line for kw in ["工作经历", "技能", "自我评价", "教育背景", "实习经历", "校园经历"]):
                if current_proj:
                    projects.append(current_proj)
                break

            date_match = re.search(r"(\d{4})[.\-/年](\d{1,2})[.\-/月]?\s*[-至~到]\s*(\d{4})?[.\-/年]?(\d{1,2})?[.\-/月]?", line)

            if date_match and ("项目" in line or "系统" in line or "平台" in line or i == section_start):
                if current_proj and current_proj.name:
                    projects.append(current_proj)
                current_proj = ProjectExperience()

                name_match = re.search(r"^([\u4e00-\u9fa5a-zA-Z0-9\s]{2,30})", line)
                if name_match:
                    current_proj.name = name_match.group(1).strip()

                start_y, start_m = date_match.group(1), date_match.group(2)
                current_proj.start_date = f"{start_y}-{start_m.zfill(2)}"
                if date_match.group(3):
                    end_y = date_match.group(3)
                    end_m = date_match.group(4) or "01"
                    current_proj.end_date = f"{end_y}-{end_m.zfill(2)}"

            elif current_proj:
                if "技术栈" in line or "技术" in line:
                    tech_match = re.search(r"[：:](.*)", line)
                    if tech_match:
                        current_proj.tech_stack = tech_match.group(1).strip()
                elif "职责" in line or "负责" in line:
                    resp_match = re.search(r"[：:](.*)", line)
                    if resp_match:
                        current_proj.responsibilities = resp_match.group(1).strip()
                elif current_proj.responsibilities:
                    current_proj.responsibilities += "\n" + line
                elif not current_proj.name:
                    current_proj.name = line

            i += 1

        if current_proj and current_proj.name:
            projects.append(current_proj)

        return projects

    def extract_skills(self) -> List[str]:
        found_skills = []
        text_lower = self.text.lower()

        for skill in SKILL_KEYWORDS:
            if skill.lower() in text_lower:
                found_skills.append(skill)

        skill_section = False
        for line in self.lines:
            if any(kw in line for kw in ["技能", "技术栈", "专业技能", "技术能力", "掌握技能"]):
                skill_section = True
                continue
            if skill_section:
                if any(kw in line for kw in ["工作经历", "项目经历", "教育背景", "自我评价"]):
                    break
                parts = re.split(r"[，,、/；;|\s]+", line)
                for part in parts:
                    part = part.strip()
                    if 1 < len(part) < 20 and part not in found_skills:
                        found_skills.append(part)

        return found_skills[:30]

    def extract_self_evaluation(self) -> str:
        eval_start = -1
        eval_end = -1
        for i, line in enumerate(self.lines):
            if any(kw in line for kw in ["自我评价", "自我简介", "个人简介", "自我介绍", "个人评价"]):
                eval_start = i + 1
            elif eval_start > 0 and any(kw in line for kw in ["工作经历", "项目经历", "教育背景", "技能"]):
                eval_end = i
                break

        if eval_start > 0:
            end_idx = eval_end if eval_end > 0 else len(self.lines)
            content = "\n".join(self.lines[eval_start:min(end_idx, eval_start + 20)])
            return content.strip()

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
