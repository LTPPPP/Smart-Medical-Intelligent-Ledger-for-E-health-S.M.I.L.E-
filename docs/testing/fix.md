
A. Lỗi nghiêm trọng xuyên suốt bộ tài liệu
•	Thống nhất tên đầy đủ của dự án.
Hiện có ít nhất ba cách viết:
o	Smart Dental Management and Diagnosis System — Report 1, trang 4; Report 3, trang 4.
o	Smart Management & Intelligent Life Ecosystem — Report 1, trang 17.
o	Smart Medical Intelligent Ledger for E-health — hai file Excel kiểm thử.
Nên chọn một tên chính thức và thay đồng bộ trong tất cả bìa, tiêu đề, metadata và worksheet.
•	Xóa hoặc cập nhật phần mẫu “Project Report” ở đầu các báo cáo.
Report 1–5 vẫn chứa các tên mẫu KienNT, TuanTV, AnhLM, trong khi nhóm thực tế là Lam Tan Phat, Tran Dai Nhan, Le Huu Khoa và Bach Cong Chinh.
•	Thống nhất danh sách chức năng và thuật ngữ giữa Report 2, 3, 4, 5 và Excel.
Ví dụ đang dùng lẫn:
o	Update appointment / Edit Appointment
o	Remove role / Revoke Role
o	Add treatment record / Add Treatment Profile
o	View customer dashboard / View Dashboard by Customer
o	Refund payment / Refund Cancel Payment
o	Input symptoms / Enter Symptoms
Nên lấy một danh sách chuẩn từ SRS rồi dùng nguyên tên đó ở WBS, SDD và test case.
•	Làm rõ việc blockchain có thực sự nằm trong phiên bản sản phẩm hay không.
Report 1 mô tả Hyperledger Fabric, IPFS và “blockchain-first architecture”, nhưng kiến trúc và database trong Report 4 chủ yếu thể hiện Gateway, IAM, Clinical EMR, Payment, AI, PostgreSQL và Redis; không thấy thành phần blockchain tương ứng trong bảng package. Nếu blockchain chưa triển khai, cần đưa vào “Future work” thay vì mô tả như chức năng hiện có.
•	Thống nhất số lượng microservice.
Report 6 ghi “four NestJS microservices: Gateway, IAM, Clinical EMR, Payment”; Report 4 lại viết “all three NestJS microservices”, mặc dù sơ đồ cũng thể hiện Gateway cùng ba service nghiệp vụ. Cần sửa thành four NestJS services/microservices hoặc giải thích Gateway không được tính là domain microservice.

B. Checklist theo từng tài liệu

1. Report 1 – Project Introduction
   •	Trang 2 – lỗi mục lục: mục 2.5 Blockchain hiện Error! Bookmark not defined.
   Cần cập nhật lại field/table of contents và kiểm tra bookmark trước khi xuất PDF.
   •	Trang 2 – thiếu mục số 4 trong mục lục.
   Sau 3. Existing Systems mục lục nhảy thẳng sang 5. Software Product Vision, trong khi trang 17 có 4. Business Opportunity.
   •	Trang 1 – năm báo cáo có khả năng sai: ghi May 2025, trong khi Report 2 lập kế hoạch Report 1 vào tháng 5/2026 và toàn bộ dự án sử dụng mốc 2026. Cần xác nhận rồi đổi thành May 2026 nếu đây là lỗi năm.
   •	Trang 8–11 – đánh số hình không liên tục.
   Đang có Figure 4 → Figure 7 → Figure 8 → Figure 10 → Figure 13. Cần dùng chức năng caption tự động và cập nhật toàn bộ số hình.
   •	Trang 10 – hình và nội dung không khớp.
   Mục đang mô tả U-Net, nhưng caption ghi Figure 10. efficientnet; hình minh họa cũng có vẻ là kiến trúc EfficientNet/MBConv chứ không phải U-Net. Cần thay hình U-Net hoặc đổi toàn bộ tiêu đề/nội dung cho đúng.
   •	Trang 9 – thiếu mục 2.4.2.
   Sau 2.4.1 Python tài liệu nhảy sang 2.4.3 UNET. Cần bổ sung mục 2.4.2 hoặc đánh lại số.
   •	Trang 14 – số hình quay lại Figure 1.
   Figure 1. Viet Nam Implants trùng với Figure 1 NextJS ở phần trước. Phải đánh số liên tục trong toàn báo cáo.
   •	Trang 16 – câu thiếu từ:
   they lack the advanced AI-driven diagnostics integrated ecosystems.
   Nên sửa thành:
   they lack advanced AI-driven diagnostics and integrated ecosystems.
   •	Trang 18 – câu bị cụt:
   serve the broader Southeast Asian dental healthcare
   Thiếu danh từ kết thúc, ví dụ market hoặc ecosystem.
   •	Trang 19 – thiếu khoảng trắng sau dấu chấm:
   care continuity.Each of these features...
   Sửa thành care continuity. Each...
   •	Trang 20 – câu kết thúc thiếu dấu chấm và bị cụt:
   expand into broader Southeast Asian healthcare
   Nên hoàn thiện thành một câu đầy đủ.
   •	Thống nhất cách viết tên công nghệ:
   NEXTJS → Next.js; NestJS giữ nguyên; Gin Gonic/Gin-Gonic chọn một; UNET → U-Net; VnPay → VNPay.
   •	Kiểm tra các số liệu chưa có nguồn: thời gian tìm phòng khám 45–60 phút, no-show 25%, các nhận định về thị trường và dental tourism. Nếu giữ lại, cần trích dẫn nguồn rõ ràng.
2. Report 2 – Project Management Plan
   •	Trang 4 – WBS thiếu số thứ tự cho Report 4–7.
   Sau 1.3 Report 3, các dòng Report 4, 5, 6, 7 không có mã 1.4, 1.5, 1.6, 1.7.
   •	Trang 4 – Forget password sai thuật ngữ.
   Nên dùng Forgot Password cho chức năng yêu cầu đặt lại mật khẩu; Reset Password là bước đặt mật khẩu mới.
   •	Trang 4–7 – kiểm tra lại phép cộng effort.
   Bảng ghi Document = 45, Design = 25, Implement = 480, tổng 550. Tổng nhóm đúng, nhưng cần xác nhận từng dòng chức năng có thực sự cộng thành 480 và không bị bỏ sót WBS ID.
   •	Trang 7 – thang đo risk probability không thống nhất.
   Các giá trị đang là Medium, Sometimes, Low. Sometimes không cùng thang đo. Nên dùng đồng nhất Low / Medium / High hoặc xác suất phần trăm.
   •	Trang 8 – thiếu dấu chấm cuối đoạn mở đầu Agile.
   Đoạn kết thúc ở contemporary market demands nhưng không có dấu câu.
   •	Trang 9 – diễn đạt Master Schedule chưa chuẩn:
   o	existed project → existing systems
   o	scope and limit of project → project scope and limitations
   o	Plan of project → Project plan
   o	manage quality of project → project quality management
   o	testing level → testing levels
   o	test case → test cases
   •	Trang 10 – Team Structure cần đối chiếu với bảng vai trò.
   Một số thành viên xuất hiện ở nhiều nhóm nhưng chưa thể hiện tỷ lệ phân bổ hoặc trách nhiệm cụ thể; nên làm rõ ai là Test Leader, AI Leader, Backend Leader.
   •	Trang 11 – tiêu đề cột bị xuống dòng lỗi:
   Communicatio n Item cần sửa thành Communication Item.
   •	Trang 12–13 – đánh số mục sai.
   Có 6.2.1 Microsoft Word, sau đó lại là 6.2.2.1 Introduction. Đúng phải là 6.2.1.1 Introduction.
   Với Excel, 6.2.2 Microsoft Excel → 6.2.2.1 Introduction là hợp lý.
   •	Trang 12 – Framework ghi ReactJS, NextJS.
   Nên chuẩn hóa thành React, Next.js, NestJS; tránh viết ReactJS/NextJS nếu các tài liệu khác dùng tên chính thức.
   •	Trang 14–16 – cách viết Github sai chuẩn.
   Sửa toàn bộ thành GitHub.
   •	Trang 15 – quy trình branch mâu thuẫn:
   Đầu đoạn nói branch chung là main, cuối đoạn lại yêu cầu push/merge vào master. Chọn một branch, thường là main.
   •	Trang 15 – quy trình Git diễn đạt sai kỹ thuật:
   Thành viên không nên “push it to the master branch and wait for Leader”. Đúng nên là: push lên feature branch → tạo pull request → review → merge vào main.
   •	Trang 16 – câu The application has been thoroughly trained. không đúng ngữ cảnh GitHub.
   Có thể sửa thành Team members are already familiar with GitHub.
3. Report 3 – Software Requirement Specification
   •	Trang 2 – mục lục thiếu mục 3.3.
   Sau 3.2 Authentication nhảy sang 3.4 Clinic Management. Cần kiểm tra section bị thiếu hoặc đánh số sai.
   •	Trang 5 – số thứ tự Actor sai:
   Admin = 1, Doctor = 2, Nurse = 2, sau đó Receptionist = 4.
   Sửa Nurse thành số 3.
   •	Trang 14 – thiếu dấu phẩy trong danh sách actor:
   Các ô như Admin, Nurse, Doctor Receptionist, Patient phải là
   Admin, Nurse, Doctor, Receptionist, Patient.
   •	Trang 14 – Gmail Service không phải actor chính xác cho Google OAuth.
   Nên đổi thành Google Identity Provider hoặc Google OAuth Service.
   •	Trang 14–15 – thuật ngữ Forget password nên đổi thành Forgot Password.
   •	Trang 15 – Use Case 19 có danh sách actor bị cụt:
   Admin, Nurse, Doctor, Receptionist, kết thúc bằng dấu phẩy. Cần xác định có Patient hay Staff và hoàn thiện ô.
   •	Trang 17 – “Delete Medical Record” cần xem lại yêu cầu nghiệp vụ y tế.
   SRS viết xóa hồ sơ và chỉ lưu audit trail, trong khi các phần khác nhấn mạnh tính bất biến/version history. Nên đổi thành archive/soft delete hoặc amendment; tránh hard delete hồ sơ y tế.
   •	Trang 18 – lỗi ngắt từ:
   after - hours, re - checks bị xuống dòng và có khoảng trắng không đúng. Dùng after-hours, rechecks.
   •	Trang 18–20 – tên use case không thống nhất với SDD và test files.
   Ví dụ:
   o	Update appointment ↔ Edit Appointment
   o	Refund payment ↔ Refund Cancel Payment
   o	Input symptoms ↔ Enter Symptoms
   o	Update symptoms ↔ Edit Symptoms
   o	Send treatment plan ↔ Approve treatment plan trong Report 2.
   •	Trang 20 – X-ray viết không đồng nhất:
   Có X-ray, X -ray, Xray. Chọn X-ray; dùng X-ray/CBCT nhất quán.
   •	Kiểm tra quyền truy cập medical records.
   Actor description nói Nurse không được truy cập clinical records, nhưng các use case/screen flow cần kiểm tra lại xem có cấp quyền xem patient/clinical data vượt quá mô tả hay không.
4. Report 4 – Software Design Document
   •	Trang 11 – số lượng microservice sai:
   Containing all three NestJS microservices...
   Trong kiến trúc có Gateway, IAM, Clinical EMR, Payment. Sửa thành four NestJS services hoặc giải thích rõ cách đếm.
   •	Trang 11–12 – bảng Code Packages thiếu package.
   Bảng chỉ liệt kê Front-End, Back-end, IAM và Clinical EMR; chưa có mô tả riêng cho:
   o	Gateway Service
   o	Payment Service
   o	AI Services
   Trong khi các thành phần này xuất hiện trong sơ đồ kiến trúc.
   •	Trang 3 – View Clinic Transform có vẻ là lỗi tên chức năng.
   Nên là View Clinic Information, View Clinic List hoặc tên đúng theo SRS.
   •	Trang 3 – các tên chức năng không tự nhiên:
   o	Lock Ban User Account → Lock/Ban User Account
   o	Unlock Unban User Account → Unlock/Unban User Account
   o	Refund Cancel Payment → chọn Refund Payment hoặc Cancel Payment
   o	Order Xray CBCT → Order X-ray/CBCT Imaging
   o	Edit Image By Treatment Profile → Edit Images in Treatment Record
   •	Trang 3–5 – tên Detailed Design không khớp SRS.
   Cần đồng bộ chính xác ID 1–87 với bảng use case trong Report 3, tránh đổi Update thành Edit, Record thành Profile, hoặc thay actor Customer/Patient.
   •	Trang 14 – định dạng bullet bị lỗi:
   •created_by, •updated_by thiếu khoảng trắng sau dấu bullet.
   •	Trang 18 – hai thuộc tính dính trên cùng dòng:
   consent_version ... • consent_accepted_at...
   Cần tách thành hai bullet riêng.
   •	Trang 27–29 – từ logical bị ngắt dòng thành logi cal.
   Cần bật “keep words together” hoặc điều chỉnh độ rộng cột.
   •	Trang 33 – giá trị mặc định bị bỏ trống:
   o	session_date: TIMESTAMP (default: )
   o	started_at: TIMESTAMP (default: )
   Cần điền, ví dụ default: now() nếu đúng schema, hoặc bỏ phần default.
   •	Kiểm tra các quan hệ “cross-DB foreign key”.
   PostgreSQL không tạo foreign key vật lý trực tiếp giữa các database độc lập. Nếu đây là logical reference, sơ đồ và mô tả phải nói rõ việc integrity được kiểm soát tại application/service layer.
   •	Tên package front-end/back-end không thống nhất:
   SMILE Front-End, SMILE Back-end, Back-end, Frontend đang dùng lẫn. Chọn một convention.
5. Report 5 – Software Test Documentation
   •	Trang 2 và trang 4 – tên phần II sai.
   Mục lục và heading ghi II. Project Management Plan, nhưng đây là Report 5. Nên đổi thành II. Software Test Documentation hoặc II. Software Test Plan.
   •	Trang 4 – ngữ pháp Why we used: chưa đúng.
   Sửa thành Why we use Agile testing: hoặc Why Agile testing was selected:.
   •	Trang 5 – câu mở đầu bullet sai cấu trúc:
   Functional testing: is a type...
   Sửa thành Functional testing is a type...
   Tương tự với Non-functional testing.
   •	Trang 7 – còn nguyên nội dung hướng dẫn của template:
   [List and provide the details...] trong Human Resources và Environment. Phải xóa trước khi nộp.
   •	Trang 7 – mã thành viên KhoaDL sai.
   Thành viên trong các tài liệu khác là KhoaLH/Le Huu Khoa. Cần sửa và kiểm tra toàn bộ mã sinh viên.
   •	Trang 7 – phiên bản Latest không đủ khả năng tái lập.
   Postman nên ghi phiên bản cụ thể; System/Acceptance testing cũng nên ghi browser, OS, Docker version và test environment URL/build ID.
   •	Trang 8 – còn nguyên placeholder:
   [Define delivery of Testing. Refer to the Project Management Plan for more details].
   •	Trang 8 – số thứ tự Deliverables bị lặp:
   1 Test plan, 2 Unit test case, 3 System test case hiện nhìn đúng trong ảnh, nhưng cần bổ sung Test Report và cân nhắc số nhiều Unit Test Cases, System Test Cases.
   •	Trang 8 – tên tệp có khoảng trắng sai:
   o	Report5_Unit Test .xlsx có khoảng trắng trước .xlsx.
   o	Report5_ Test Report.xlsx không khớp tên tệp thực tế Report5_TestReport.xlsx.
   Nên dùng đúng:
   o	Report5_Unit Test.xlsx
   o	Report5_TestReport.xlsx
   •	Trang 9–10 – bảng Test Reports thiếu tiêu đề cột và quá nhỏ.
   Không thể xác định rõ các cột là Total/Failed/Untested/Normal/Abnormal/Boundary. Nên chèn bảng thật hoặc ảnh độ phân giải cao có header.
   •	Trang 10 – kiểm tra subtotal:
   Ảnh thể hiện các tổng 430 và 431 ở các cột khác nhau nhưng không có header giải thích. Cần ghi rõ mỗi số đại diện cho gì và đối chiếu với Excel.
6. Report 6 – Software User Guides
   •	Trang 2 – mục lục thiếu mục lớn số 3.
   Sau 2.2 Installation Instruction nhảy thẳng sang 3.1 Overview. Cần thêm heading 3. User Guide hoặc 3. Operating Guide.
   •	Trang 3 – Record of Changes hoàn toàn trống.
   Cần điền ít nhất phiên bản đầu tiên, ngày phát hành, người phụ trách và mô tả thay đổi.
   •	Trang 4 – Installation Instruction nên là Installation Instructions.
   •	Trang 4 – Source Codes nên là Source Code.
   •	Trang 4 – 7 Slide nên là Presentation Slides hoặc Slide Deck.
   •	Trang 5 – typo trong caption:
   Download Docker Destop → Download Docker Desktop.
   •	Trang 7–9 – tên công nghệ không đúng chuẩn:
   o	NodeJS → Node.js
   o	Postgresql → PostgreSQL
   o	Caption Setup NodeJS → Set up Node.js hoặc Node.js setup
   •	Trang 10 – yêu cầu phiên bản Python mâu thuẫn.
   Heading ghi Installing Python 3.11+; KYC dùng Python 3.11 nhưng Booking LangGraph yêu cầu python3.13. Cần ghi rõ hệ thống cần đồng thời Python 3.11 và 3.13, hoặc chuẩn hóa về một phiên bản.
   •	Trang 10–11 – chữ Bash đang xuất hiện như văn bản thừa.
   Nên định dạng code block, không để chữ “Bash” thành một dòng nội dung thông thường.
   •	Trang 15–16 – cài PostgreSQL thủ công có thể mâu thuẫn với Docker Compose.
   Tài liệu trước đó yêu cầu Docker Desktop và nói stack có container PostgreSQL. Cần tách rõ hai lựa chọn:
7. Recommended: Docker Compose.
8. Optional: native PostgreSQL installation.
   Tránh yêu cầu người dùng thực hiện cả hai.
   •	Trang 16 – danh sách database không hoàn toàn khớp cách mô tả service.
   IAM có hai logical DB, Clinical EMR có hai DB. Cần giải thích đây là database/schema tách theo bounded context, không phải “one database per service” theo nghĩa tuyệt đối.
   •	Trang 17 trở đi – ảnh giao diện quá mờ/trắng.
   Nhiều trường và nút không đọc được, không đáp ứng vai trò “user guide”. Cần chụp lại ở 100% zoom, crop vùng thao tác và thêm callout/mũi tên.
   •	Trang 32 – ảnh Checked-in appointment gần như trống.
   Cần thay ảnh hoặc kiểm tra lỗi xuất PDF.
   •	Các bước chưa nêu điều kiện đầu vào và kết quả lỗi.
   Mỗi flow nên bổ sung:
   o	Required role
   o	Prerequisites
   o	Input constraints
   o	Success message
   o	Common errors và cách xử lý.
9. Report5_Unit Test.xlsx
   •	Sai tên đầy đủ dự án trên toàn workbook:
   S.M.I.L.E — Smart Medical Intelligent Ledger for E-health không khớp tên trong Report 1 và SRS.
   •	Metadata phiên bản mâu thuẫn ngay trên sheet:
   Document Code có ver.1.2, ver.1, trong khi ô Version ghi 1.0. Cần chỉ giữ một phiên bản hiện hành và ghi lịch sử ở Record of Change.
   •	Sheet Statistics ghi tổng 431 test cases, trong khi Test Report mô tả ban đầu 398 test cases. Cần giải thích 398 là system/use-case tests, còn 431 là unit tests; nếu không phải, đây là lỗi số liệu.
   •	Cột Lack of test cases để trống ở nhiều sheet.
   Nếu không có thiếu sót, ghi None; nếu có, phải liệt kê branch/condition chưa kiểm thử.
   •	Defect ID trống toàn bộ.
   Nếu tất cả pass thì ghi N/A; không nên để ô kiểm soát hoàn toàn trống.
   •	Tên function không thống nhất với SRS/SDD:
   Ví dụ Edit Image by Treatment Profile, Export Medical Record Profile, Add Treatment Profile. Cần đổi theo canonical use-case list.
   •	Nhiều test chỉ có hai case Normal/Abnormal, không có Boundary.
   Trong khi bảng thống kê quảng bá phân loại N/A/B. Cần bổ sung boundary case cho độ dài chuỗi, ngày, số tiền, pagination, file size, timeout, concurrency và quyền truy cập.
   •	Kiểm tra phân quyền trong test:
   Sheet View Doctor Performance Report ghi precondition Doctor is already logged in, trong khi SRS quy định use case này dành cho Admin. Phải sửa precondition/actor thành Admin.
10. Report5_TestReport.xlsx
    •	Sai tên đầy đủ dự án giống Unit Test workbook.
    •	Reference trong Record of Change trỏ tới tên tệp khác:
    docs/testing/fix/SMILE_UnitTest_UC.xlsx không khớp tên deliverable hiện tại. Cần sửa thành đường dẫn/tên file thật hoặc đính kèm file được tham chiếu.
    •	Số lượng test case 398 cần đối chiếu với thống kê 431 trong Unit Test và bảng 430/431 trong Report 5 PDF.
    Nên lập bảng:
    o	Unit test cases
    o	System test cases
    o	Acceptance test cases
    o	Tổng theo từng loại
    Không gộp các tổng khác bản chất.
    •	Nhiều test data chỉ là placeholder không hợp lệ:
    query-01, record_status-01, cost-01, performed_by-01, diagnosis-01.
    Nên thay bằng dữ liệu hợp lệ theo schema/domain, ví dụ date range, UUID, decimal cost, enum status.
    •	Expected Result và Actual Result thường giống hệt câu chung:
    The operation completes successfully and returns success.
    Cần ghi kết quả có thể kiểm chứng: HTTP status, message, ID được tạo, thay đổi database, trạng thái UI và audit log.
    •	Test case “invalid ID empty” nhưng bước thao tác lại nói chọn non-existent record.
    empty ID và non-existent ID là hai test khác nhau:
    o	empty → validation 400
    o	UUID không tồn tại → 404 Not Found
    Cần tách riêng.
    •	Một số precondition không khớp actor/quyền.
    Ví dụ báo cáo doctor performance phải là Admin, dashboard customer phải thống nhất dùng Patient thay vì Customer.
    •	Ngày thực thi đến 24/07/2026, trong khi Report 5 ghi test deliverables đến 17/07 và Project Plan dự kiến Report 5 ngày 19/07. Cần cập nhật milestone thực tế hoặc giải thích đây là regression round sau ngày bàn giao.
    •	Tất cả test đều Passed nhưng không có defect evidence.
