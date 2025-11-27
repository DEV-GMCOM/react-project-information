# GMCOM 접근 제어 정책 (Access Control Policy)

## 1. 서론

GMCOM 애플리케이션은 민감한 정보와 기능에 대한 안전하고 효율적인 접근을 보장하기 위해 강력한 접근 제어 메커니즘을 구현합니다. 본 문서는 GMCOM 애플리케이션의 접근 제어 정책을 상세히 설명하며, 사용자에게 필요한 정보에만 접근하고 허가된 작업만을 수행할 수 있도록 하는 원칙과 절차를 규정합니다.

접근 제어는 데이터 보안을 강화하고, 사용자 경험을 최적화하며, 규정 준수를 지원하는 데 필수적입니다. 본 정책은 역할 기반 접근 제어(RBAC) 모델을 기반으로 하며, 권한을 '기능(Function)'과 '섹션(Section)'으로 명확히 분류하고, **백엔드 중심의 강제 적용**을 핵심 원칙으로 삼습니다.

본 문서는 다음 두 그룹의 사용자를 대상으로 합니다.
*   **정책 관리자 (사용자):** 권한 및 역할 정의, 사용자 할당 등 시스템의 접근 제어 정책을 관리하는 역할을 담당합니다.
*   **개발자:** 접근 제어 정책을 이해하고, 이를 코드베이스(프런트엔드 및 백엔드)에 구현하며, 시스템 전반의 보안과 일관성을 유지하는 역할을 담당합니다.

## 2. 핵심 개념

### 2.1. 역할 기반 접근 제어 (RBAC - Role-Based Access Control)

RBAC는 사용자에게 직접 권한을 부여하는 대신, '역할(Role)'을 중심으로 권한을 관리하는 보안 모델입니다.
*   **작동 방식:** 특정 직무나 책임을 가진 사용자들에게 '역할'을 부여하고, 해당 역할에 필요한 '권한'을 할당합니다.
*   **장점:**
    *   **확장성:** 사용자 수가 증가하거나 역할 구조가 변경되어도 권한 관리가 용이합니다.
    *   **관리 효율성:** 권한을 역할 단위로 묶어 관리하므로, 개별 사용자별로 권한을 관리하는 것보다 효율적입니다.
    *   **일관성:** 동일한 역할을 가진 모든 사용자가 동일한 권한을 갖게 되어 일관성을 유지할 수 있습니다.

### 2.2. 권한 분류

GMCOM 애플리케이션의 권한은 크게 두 가지 유형으로 나뉘며, 각각의 목적과 관리 방식을 명확히 합니다.

*   **기능 권한 (Function Permissions):**
    이 권한은 사용자에게 특정 '작업(Action)'이나 '연산(Operation)'을 수행할 수 있는 능력을 부여합니다. 이는 주로 버튼 클릭, 폼 제출 등 사용자가 직접 트리거하는 행위와 관련됩니다.
    *   **특징:** 동사(Verb)와 같은 행위를 나타냅니다.
    *   **예시:** `create_project` (프로젝트 생성), `edit_company_details` (회사 세부 정보 수정), `delete_user` (사용자 삭제), `approve_request` (요청 승인), `upload_file` (파일 업로드).

*   **섹션 권한 (Section Permissions):**
    이 권한은 사용자에게 애플리케이션의 특정 '영역(Area)' 또는 '데이터 집합'에 접근하거나 볼 수 있는 권한을 부여합니다. 이는 주로 페이지의 특정 부분, 메뉴 항목, 정보 목록 등을 표시하는 데 사용됩니다.
    *   **특징:** 명사(Noun) 또는 명사구와 같은 영역이나 대상을 나타냅니다.
    *   **예시:** `view_project_list` (프로젝트 목록 보기), `view_company_profile` (회사 프로필 보기), `view_dashboard_overview` (대시보드 개요 보기), `access_reports_section` (보고서 섹션 접근), `view_user_management_section` (사용자 관리 섹션 보기).
    *   **맥락적 권한 (Contextual Permissions):** 섹션 권한 중 일부는 특정 맥락(예: 사용자가 속한 본부, 팀 등)에 따라 제한될 수 있습니다. `view_hq_projects_list` (본부별 프로젝트 목록 보기) 또는 `view_team_project_details` (팀별 프로젝트 상세 정보 보기)와 같은 권한이 이에 해당합니다.

### 2.3. 백엔드 중심 강제 적용 (Backend-Centric Enforcement)

GMCOM 애플리케이션은 접근 제어에 있어 **백엔드 중심(Backend-Centric)** 접근 방식을 채택합니다. 이는 애플리케이션의 보안과 무결성을 유지하는 가장 효과적인 방법입니다.

*   **최종 결정권:** 모든 중요 권한 검증은 **백엔드 서버**에서 이루어집니다. 사용자가 특정 데이터를 보거나 작업을 수행하려 할 때, 백엔드는 해당 사용자의 권한을 확인하고 접근을 허용하거나 차단합니다.
*   **보안 강화:** 프런트엔드는 사용자 경험 개선을 위해 UI 요소를 조건부로 표시/숨김 처리할 수 있지만, 이것은 보안의 주된 수단이 아닙니다. 백엔드에서 접근이 차단되면 프런트엔드에서의 UI 표시 여부와 상관없이 실제 접근은 불가능합니다. 이는 악의적인 사용자가 프런트엔드 코드를 조작하여 권한을 우회하려는 시도를 막는 데 필수적입니다.
*   **데이터 일관성:** 백엔드에서 권한을 강제함으로써, 애플리케이션 전반에 걸쳐 데이터 접근 및 작업에 대한 일관된 보안 정책이 적용됨을 보장합니다.

---

## 3. 정책 관리자 (사용자)용

정책 관리자로서 귀하의 역할은 애플리케이션의 접근 제어 체계를 정의하고, 사용자에게 필요한 리소스에만 접근할 수 있도록 권한 및 역할을 효율적으로 관리하는 것입니다. **권한관리 페이지**를 통해 모든 권한 설정 작업을 수행합니다.

### 3.1. 귀하의 역할

*   애플리케이션의 기능 및 섹션별로 필요한 **권한 코드**를 정의합니다.
*   업무 흐름 및 보안 요구사항에 맞게 **역할(Role)**을 생성하고, 각 역할에 적절한 권한 코드들을 할당합니다.
*   각 사용자를 해당되는 **역할**에 할당하고, 필요한 경우 **맥락 정보**(예: 본부, 팀)를 지정합니다.
*   '최소 권한의 원칙(Principle of Least Privilege)'에 따라 사용자에게 필요한 최소한의 권한만 부여하여 보안을 강화합니다.

### 3.2. 권한 설정 워크플로우

권한 설정은 다음의 계층적 순서대로 진행됩니다.

1.  **메뉴(페이지) 접근 권한 설정:**
    *   사용자가 애플리케이션 내 특정 **페이지**에 접근할 수 있는지 여부를 결정합니다. 이는 가장 기본적인 접근 제어 단계입니다.
    *   예: `view_project_management_page` 권한을 부여받은 사용자만 프로젝트 관리 메뉴에 접근할 수 있습니다.

2.  **페이지 내 항목(섹션/기능) 접근 권한 설정:**
    *   사용자가 특정 페이지에 접근 권한이 있더라도, 해당 페이지 내의 특정 **섹션**(예: 탭, 정보 블록, 특정 폼 영역)을 볼 수 있는지, 또는 특정 **기능**(예: 버튼, 링크)을 사용할 수 있는지 결정합니다.
    *   예: `view_project_profile_section` 권한이 있는 사용자만 프로젝트 상세 페이지에서 '세부 정보' 탭을 볼 수 있습니다.

3.  **항목 조작 권한 설정:**
    *   마지막으로, 사용자가 특정 항목(프로젝트, 회사 등)에 대해 실제 **작업(Create, Edit, Delete 등)**을 수행할 수 있는지를 결정합니다. 이는 주로 '기능 권한'에 해당합니다.
    *   예: `edit_project` 권한이 있어야만 프로젝트 수정 버튼을 누르고 프로젝트 정보를 변경할 수 있습니다.

이러한 권한들은 **권한관리 페이지**에서 다음과 같은 방식으로 정의 및 관리됩니다.

#### 3.2.1. 권한 코드 (Permission Codes)

각 권한은 고유한 식별자인 '권한 코드'로 정의됩니다. 코드명은 해당 권한의 목적을 명확히 알 수 있도록 작성하며, 일관된 명명 규칙(예: `[action/operation]_[resource]_[context]`)을 따릅니다.

*   **기능 권한 코드 예시:**
    *   `create_project`: 새로운 프로젝트 생성 권한.
    *   `edit_company_details`: 특정 회사의 세부 정보 수정 권한.
    *   `delete_user`: 사용자 계정 삭제 권한.
    *   `approve_request`: 특정 종류의 요청(예: 비용 처리) 승인 권한.
    *   `upload_file`: 파일 업로드 기능 사용 권한.

*   **섹션 권한 코드 예시:**
    *   `view_project_list`: 전체 프로젝트 목록 조회 권한.
    *   `view_company_profile`: 회사 프로필 정보 조회 권한.
    *   `view_dashboard_overview`: 대시보드 주요 개요 데이터 조회 권한.
    *   `access_reports_section`: 보고서 관련 메뉴 및 섹션 접근 권한.
    *   `view_user_management_section`: 사용자 관리 페이지 섹션 접근 권한.
    *   `view_hq_projects_list`: (맥락적 섹션) 자신이 속한 본부(HQ)의 프로젝트 목록 조회 권한.
    *   `view_team_project_details`: (맥락적 기능/섹션) 자신이 속한 팀의 프로젝트 상세 정보 조회 권한.

#### 3.2.2. 역할 (Roles)

역할은 특정 직무 또는 책임 수준을 나타내는 권한의 집합입니다. 여러 역할을 가진 사용자도 있을 수 있습니다.

*   **역할 예시:**
    *   `CEO`
    *   `Vice President` (부사장)
    *   `Head of Department` (본부장)
    *   `Team Leader` (팀장)
    *   `PM` (프로젝트 매니저)
    *   `Team Member` (팀원)
    *   `Viewer` (기본 보기 권한 사용자)

#### 3.2.3. 역할에 권한 할당

정의된 권한 코드들을 적절한 역할에 할당합니다. 이는 각 역할이 수행해야 하는 작업을 기반으로 결정됩니다.

*   **역할: `CEO`**
    *   할당 권한: `view_all_projects_list`, `view_all_project_details`, `create_company`, `manage_users`, `access_all_sections` (모든 기능 및 섹션에 대한 최상위 접근 권한)

*   **역할: `Head of Department` (본부장)**
    *   할당 권한: `view_all_projects_list`, `view_hq_projects_list`, `view_all_project_details`, `view_hq_project_details`, `view_company_profile`
    *   (설명: 모든 프로젝트 목록을 볼 수 있지만, 상세 정보는 본부 내의 것만 접근 가능)

*   **역할: `Team Leader` (팀장)**
    *   할당 권한: `view_hq_projects_list`, `view_team_projects_list`, `view_hq_project_details`, `view_team_project_details`, `edit_team_project`
    *   (설명: 본부 및 팀의 프로젝트 목록을 볼 수 있고, 상세 정보는 팀 내의 것만 접근 가능. 팀 프로젝트 수정 가능)

*   **역할: `PM` (프로젝트 매니저)**
    *   할당 권한: `view_team_projects_list`, `view_team_project_details`, `edit_team_project`, `create_project_task`
    *   (설명: 자신의 팀 프로젝트만 목록 및 상세 정보 보기 가능, 팀 프로젝트 수정 및 태스크 생성 가능)

#### 3.2.4. 사용자에게 역할 및 맥락 할당

*   각 사용자는 하나 이상의 역할에 할당되어야 합니다.
*   **맥락 정보의 중요성:** `Head of Department`, `Team Leader`, `PM`과 같이 특정 본부나 팀에 기반한 권한을 가진 역할의 경우, 해당 사용자가 속한 **본부(HQ) ID** 또는 **팀(Team) ID**와 같은 맥락 정보를 사용자 프로필에 정확히 할당해야 합니다. 이 정보는 백엔드에서 해당 사용자가 접근할 수 있는 데이터 범위를 결정하는 데 사용됩니다.

### 3.3. 예시 시나리오: 프로젝트 프로필 접근

**시나리오:** 사용자의 역할(CEO, VP, 본부장, 팀장, PM) 및 소속(본부, 팀)에 따라 프로젝트 목록 및 상세 정보 접근 규칙을 적용합니다.

**정책 관리자 작업:**

1.  **권한 코드 정의 (권한관리 페이지 사용):**
    *   `view_all_projects_list` (섹션)
    *   `view_hq_projects_list` (섹션)
    *   `view_team_projects_list` (섹션)
    *   `view_all_project_details` (기능/섹션)
    *   `view_hq_project_details` (기능/섹션)
    *   `view_team_project_details` (기능/섹션)
    *   `edit_project` (기능)

2.  **역할 정의 및 권한 할당:** (위 3.2.3. 예시 참조)

3.  **사용자 맥락 할당:**
    *   각 사용자가 올바른 역할에 할당되었는지 확인합니다.
    *   예를 들어, '본부장' 역할을 가진 사용자에게는 해당 본부의 `hqId`를, '팀장' 또는 'PM' 역할을 가진 사용자에게는 해당 팀의 `teamId`를 사용자 정보에 할당합니다.

이 설정이 완료되면, 해당 사용자는 자신의 역할과 맥락에 따라 **프로젝트 목록에서 볼 수 있는 항목이 필터링**되며, **프로젝트 상세 정보 접근 시에도 본부 또는 팀 기반의 접근 제어**가 백엔드에서 적용됩니다.

---

## 4. 개발자용

개발자는 정책 관리자가 정의한 접근 제어 정책을 준수하는 애플리케이션 로직을 구현하는 역할을 담당합니다. 여기에는 백엔드 API와의 효율적인 연동 및 UI 요소의 조건부 렌더링이 포함됩니다.

### 4.1. 귀하의 역할

*   백엔드 API를 호출하는 프런트엔드 컴포넌트를 구현합니다.
*   API 호출이 백엔드에서 안전하게 권한 검증을 거치도록 합니다.
*   `hasPermission`과 같은 로직을 활용하여 UI 요소를 조건부로 표시/숨김 처리함으로써 사용자 경험을 개선합니다.
*   권한 거부(예: HTTP 403 Forbidden 오류)와 같은 백엔드 응답을 우아하게 처리합니다.

### 4.2. API 기반 권한 정의 전략

REST API 호출을 기반으로 권한을 정의하고 관리하는 것은 정책 관리자와 개발자 모두에게 명확한 지침을 제공합니다.

1.  **API 호출 목록 파악 및 분류:**
    *   애플리케이션에서 사용되는 모든 REST API 호출을 파악합니다.
    *   각 API 호출을 **HTTP 메소드**(GET, POST, PUT, DELETE 등)별로 구분하여 리스트업합니다.
    *   분류된 API 호출 목록을 해당 API가 속한 **페이지별**로 그룹화합니다.

2.  **정책 관리자에게 선택 가능한 리스트 형태로 제공:**
    *   이렇게 정리된 API 목록을 정책 관리자에게 제공하여, 관리자가 **권한관리 페이지**에서 해당 API 호출에 대한 권한(이를 '기능' 또는 '섹션' 권한으로 매핑)을 쉽게 선택하고 역할에 할당할 수 있도록 지원합니다.
    *   **예시 (API 목록 및 페이지별 그룹화):**

        *   **프로젝트 관리 페이지 (Project Management Page)**
            *   `GET`: `/api/projects` - 프로젝트 목록 조회 (섹션 권한 `view_project_list`와 연동)
            *   `GET`: `/api/projects/{id}` - 프로젝트 상세 조회 (섹션/기능 권한 `view_project_details`와 연동)
            *   `POST`: `/api/projects` - 프로젝트 생성 (기능 권한 `create_project`와 연동)
            *   `PUT`: `/api/projects/{id}` - 프로젝트 수정 (기능 권한 `edit_project`와 연동)
            *   `DELETE`: `/api/projects/{id}` - 프로젝트 삭제 (기능 권한 `delete_project` 연동)

        *   **회사 관리 페이지 (Company Management Page)**
            *   `GET`: `/api/companies` - 회사 목록 조회 (섹션 권한 `view_company_list`와 연동)
            *   `GET`: `/api/companies/{id}` - 회사 상세 조회 (섹션 권한 `view_company_profile`과 연동)
            *   `POST`: `/api/companies` - 회사 생성 (기능 권한 `create_company`와 연동)

3.  **프런트엔드에서의 `hasPermission` 활용 (코드 예시):**
    개발자는 `hasPermission` 함수를 사용하여 UI 요소를 조건부로 렌더링합니다. 이 함수는 백엔드에서 설정된 권한 코드를 참조하며, 필요에 따라 사용자 맥락(HQ ID, Team ID 등)을 인자로 받아 동적 검사를 수행합니다. `hasPermission`은 주로 사용자 경험(UX) 개선을 위한 목적이며, 실제 보안은 백엔드에서 강제됩니다.

    **예시: 프로젝트 목록 조건부 표시**
    ```typescript
    // 프로젝트 목록을 표시하는 컴포넌트 (예: Dashboard.tsx 또는 ProjectListPage.tsx)
    import { useAuth } from '../contexts/AuthContext'; // 사용자 정보를 위해
    import { usePermissions } from '../hooks/usePermissions'; // hasPermission 함수를 위해
    // Assume getProjectsFromBackend() returns projects filtered by backend, or all projects to be filtered client-side

    function ProjectList() {
        const { user } = useAuth(); // 현재 사용자의 정보 (hqId, teamId, roles 등)
        const { hasPermission } = usePermissions(); // 권한 검사 함수
        const [projects, setProjects] = useState([]);

        useEffect(() => {
            const fetchAndDisplayProjects = async () => {
                try {
                    // 백엔드는 이미 필터링된 프로젝트를 반환하거나, 모든 프로젝트를 반환할 수 있습니다.
                    // 클라이언트 측 필터링은 추가적인 UX 개선을 위해 사용될 수 있습니다.
                    const fetchedProjects = await getProjectsFromBackend(); 

                    let filteredProjects = fetchedProjects;

                    // 사용자의 역할과 맥락에 따라 프로젝트 목록 필터링
                    if (hasPermission('view_hq_projects_list') && user.hqId) {
                        filteredProjects = fetchedProjects.filter(p => p.hqId === user.hqId);
                    } else if (hasPermission('view_team_projects_list') && user.teamId) {
                        filteredProjects = fetchedProjects.filter(p => p.teamId === user.teamId);
                    }
                    // hasPermission('view_all_projects_list')가 true라면 별도 필터링 없음

                    setProjects(filteredProjects);

                } catch (error) {
                    console.error("프로젝트 조회 오류:", error);
                    // API 오류 처리 (예: 권한 부족 시 메시지 표시)
                }
            };
            fetchAndDisplayProjects();
        }, [user, hasPermission]);

        return (
            <div>
                <h2>Projects</h2>
                {/* 프로젝트를 볼 수 있는 권한이 있을 때만 목록 렌더링 */}
                {hasPermission('view_all_projects_list') || hasPermission('view_hq_projects_list') || hasPermission('view_team_projects_list') ? (
                    <ul>
                        {projects.map(project => (
                            <li key={project.id}>
                                {project.name} 
                                {/* 상세 보기 링크는 해당 권한이 있을 때만 표시 */}
                                {hasPermission('view_team_project_details', { projectId: project.id, hqId: project.hqId, teamId: project.teamId }) && (
                                    <a href={`/projects/${project.id}`}>View Details</a>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>You do not have permission to view any projects.</p>
                )}
            </div>
        );
    }
    ```

    **예시: 프로젝트 상세 정보 접근 권한 확인**
    ```typescript
    // ProjectProfile.tsx 파일에서
    import { useAuth } from '../contexts/AuthContext';
    import { usePermissions } from '../hooks/usePermissions';
    // Assume fetchProjectDetails(projectId) fetches details for a specific project

    function ProjectProfile({ projectId }) {
        const { user } = useAuth();
        const { hasPermission } = usePermissions();
        const [projectDetails, setProjectDetails] = useState(null);
        const [accessDenied, setAccessDenied] = useState(false);

        useEffect(() => {
            const loadProjectDetails = async () => {
                try {
                    // 프로젝트의 hqId 및 teamId와 같은 맥락 정보를 얻기 위해 기본 정보 조회
                    const basicProjectInfo = await getProjectBasicInfo(projectId); // { id, name, hqId, teamId } 반환 가정

                    // 사용자의 역할, 맥락 정보 및 해당 프로젝트의 맥락 정보를 기반으로 상세 정보 접근 권한 확인
                    const canViewDetails = hasPermission('view_all_project_details') ||
                                           (hasPermission('view_hq_project_details') && user.hqId === basicProjectInfo.hqId) ||
                                           (hasPermission('view_team_project_details') && user.teamId === basicProjectInfo.teamId);

                    if (canViewDetails) {
                        const details = await fetchProjectDetails(projectId);
                        setProjectDetails(details);
                    } else {
                        setAccessDenied(true); // 접근 권한이 없을 경우 플래그 설정
                    }
                } catch (error) {
                    console.error("Error loading project details:", error);
                    // API 오류 처리 (예: 403 Forbidden 응답 시 accessDenied 설정)
                    if (error.response && error.response.status === 403) {
                        setAccessDenied(true);
                    }
                }
            };
            loadProjectDetails();
        }, [projectId, user, hasPermission]);

        if (accessDenied) {
            return <p>You do not have permission to view this project's details.</p>;
        }

        if (!projectDetails) {
            return <p>Loading project details...</p>;
        }

        return (
            <div>
                <h2>{projectDetails.name}</h2>
                {/* 프로젝트 상세 정보 표시 */}
                <p>HQ: {projectDetails.hqId}</p>
                <p>Team: {projectDetails.teamId}</p>
                {/* ... other details ... */}
            </div>
        );
    }
    ```

#### 4.2.1. API 연동

*   API 호출 시, 백엔드에서 권한을 강제한다고 가정합니다. 만약 사용자의 권한이 부족하여 API 호출이 실패할 경우, 백엔드는 적절한 오류 응답(예: HTTP 403 Forbidden)을 반환해야 합니다.
*   프런트엔드는 이러한 오류를 우아하게 처리하여 사용자에게 권한 부족 사실을 알리거나, 접근 가능한 기능만 표시하도록 UI를 조정해야 합니다.

---

## 5. 용어집

*   **RBAC (Role-Based Access Control, 역할 기반 접근 제어):** 사용자의 역할에 따라 시스템 접근을 제한하는 보안 모델.
*   **Permission (권한):** 사용자 또는 역할에 부여된 특정 행위 수행 또는 정보 접근 권리 (예: `create_project`).
*   **Role (역할):** 직무 기능, 직책 또는 접근 수준을 나타내는 권한의 집합 (예: `Team Leader`).
*   **Function Permission (기능 권한):** 특정 '작업'을 수행할 수 있는 권한 (예: `edit_company_details`).
*   **Section Permission (섹션 권한):** 애플리케이션의 특정 '영역'이나 데이터에 접근하거나 볼 수 있는 권한 (예: `view_project_list`).
*   **Contextual Permission (맥락적 권한):** 사용자의 소속(본부, 팀 등)이나 접근 대상 항목의 속성에 따라 달라지는 권한 (예: `view_hq_project_details`).
