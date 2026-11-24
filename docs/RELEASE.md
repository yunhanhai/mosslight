# 开源与发布记录

日期：2026-11-21（Asia/Shanghai）。

v1.3 发布维护日期：2026-11-22（Asia/Shanghai）。

v1.4 发布维护日期：2026-11-23（Asia/Shanghai）。

## 状态

| 项目                          | 状态                                                                     |
| ----------------------------- | ------------------------------------------------------------------------ |
| 本地游戏                      | 已完成，源码与启动入口在项目根                                           |
| 标准 / 练习、胜败、升级、触控 | 已实现并通过对应测试                                                     |
| 开源许可证                    | MIT；标题字体单独 OFL 1.1                                                |
| GitHub                        | main 已推送，公开；匿名 API 访问 HTTP 200                                |
| Gitee                         | main 已推送，公开；匿名 API 访问 HTTP 200                                |
| 在线试玩                      | 已部署 GitHub Pages，HTTP 200，桌面与手机浏览器线上交互通过              |
| GitHub CI                     | Linux / Chromium 的 Checks 成功                                          |
| v1.0 独立复核                 | 两项修复均为 Resolved，复核结论 ship（见 REVIEW.md 的范围限制）          |
| v1.1.0                        | 已部署并完成桌面 / 手机公网验证；25 项逻辑/构建测试、23 项浏览器流程通过 |

## v1.6.0 发布验证

发布日期：2026-11-24（Asia/Shanghai）。

- 游戏改进提交：`ccf016da4c5f66ed395d8fcbfcc8c5fcae548d18`，GitHub 与 Gitee main 均已同步。
- Linux / Chromium Checks：https://github.com/yunhanhai/mosslight/actions/runs/45355138816 — success。
- Pages 部署：https://github.com/yunhanhai/mosslight/actions/runs/45355138886 — success。
- 本地 84 项规则 / 存储 / 几何 / 构建检查通过；场景 31、原面板 26、续玩 19、每日 / 分享 16，合计 92 项浏览器流程通过，4 项手机专用在桌面跳过。
- 公网桌面 / 手机实际加载 1.6.0，新增每日局暂存刷新、原日期 / 固定角色 / 种子保留、每日成绩不改正式计分、摘要版本 / 日期、打开生成链接后同一挑战均通过；原完整游玩流程继续通过，9 模块版本参数统一，无检测到的页面 / 资源错误。
- 构建 `build-verification-v1.6.json`、公网 `online-verification-v1.6.json`、五种尺寸 65 状态 `layout-verification-v1.6.json` 已保存；每日说明、分享摘要、有效链接入口截图独立版本化。
- 版本页：https://github.com/yunhanhai/mosslight/releases/tag/v1.6.0。
- 每日为本机记录与固定起点，没有联网排行；输入、视口、版本与本机时钟影响实际体验。复制只在点击后执行，不自动发送。真实 iOS / 低端设备与玩家反馈仍待完成。

## v1.5.0 发布验证

发布日期：2026-11-24（Asia/Shanghai）。

- 游戏改进提交：`c3995cc71f3f3b75113b771443015ccf9c07ec4a`，GitHub 与 Gitee main 已同步。
- Linux / Chromium Checks：https://github.com/yunhanhai/mosslight/actions/runs/45215344592 — success。
- Pages 部署：https://github.com/yunhanhai/mosslight/actions/runs/45215344606 — success。
- 本地 74 项规则 / 存储 / 几何 / 构建测试通过；场景 31、原面板 26、暂存 19，合计 76 项浏览器流程通过，4 项手机专用在桌面跳过。
- 公网桌面 / 手机均实际加载 1.5.0；刷新正在升级的页面后，时间、角色、三选一与已用换选保留，恢复后继续升级、暂停、边缘取景、巨蛾画外指示、结算、足迹与同种子重试通过；8 个模块版本参数一致，无检测到的页面 / 资源错误。
- 构建验证 `build-verification-v1.5.json`、公网验证 `online-verification-v1.5.json`，五种尺寸 50 个状态见 `layout-verification-v1.5.json`；续玩入口 / 恢复 / 成长提示的新截图独立保存。
- 版本页：https://github.com/yunhanhai/mosslight/releases/tag/v1.5.0。
- 暂存仅位于当前标签页 sessionStorage，关闭后不保证保留，异常中止可能退回最近一次暂存；不影响已有正式成绩。真人 / 真实 iOS / 低端设备与平衡验证仍待完成。

## v1.4.0 发布验证

发布日期：2026-11-23（Asia/Shanghai）；主要实现与本地检查于 11 月 22 日完成。

- 游戏改进提交：`e4341c37619d849bd1b0c89ed39c481bea082dc1`，GitHub 与 Gitee main 已同步。
- Linux / Chromium Checks：https://github.com/yunhanhai/mosslight/actions/runs/45207021552 — success。
- Pages 部署：https://github.com/yunhanhai/mosslight/actions/runs/45207021442 — success。
- 本地 62 项规则 / 存储 / 几何 / 构建测试、57 项桌面 / 手机浏览器流程通过；3 项手机专用用例在桌面跳过。
- 公网桌面 / 手机均实际加载 1.4.0，角色选择与真实初始属性、图鉴、设置保存、升级 / 换选、暂停属性、角落 / 画外巨蛾提示、结算战斗明细、足迹与保留角色的同种子重试通过；7 个模块版本参数一致，无检测到的页面或资源错误。
- 构建验证 `build-verification-v1.4.json`、公网验证 `online-verification-v1.4.json`、五种尺寸 35 个面板状态 `layout-verification-v1.4.json` 及独立的角色 / 战斗 / 结果截图已保存。
- 补充正常生命值的 60 局诊断模拟：5 个种子 × 3 位守夜人 × 2 种模式 × 2 类视野，全部走到黎明。脚本使用精确模型位置决定移动与升级，无修改生命 / 伤害 / 敌人；结果仅属于该自动策略，不代表真人胜率或平衡定论。详见 `simulation-v1.4.json` 和 `scripts/simulate-runs.mjs`。
- 版本页：https://github.com/yunhanhai/mosslight/releases/tag/v1.4.0。
- 真实 iOS / 低端设备、玩家对角色差异与难度的评价仍待完成；本轮不根据诊断机器人胜率直接调整平衡。

## v1.3.0 发布验证

发布日期：2026-11-22（Asia/Shanghai）。

- 游戏改进提交：`624f94bf718cc81ae869cef07af323f30be53df4`。
- 产物精确 ID / OIDC 部署修复：`8e154cecd8b116bba4c711074d93d2e62f46b55b`。
- Linux / Chromium Checks：https://github.com/yunhanhai/mosslight/actions/runs/44923400171 — success。
- Pages 部署：https://github.com/yunhanhai/mosslight/actions/runs/44923400218 — success。
- 本地 48 项逻辑 / 存档 / 几何 / 构建检查通过；浏览器场景套件 31 通过、3 项手机专用用例在桌面跳过，面板套件 18 通过，合计 49 通过。
- 公网桌面 / 手机均实际加载 1.3.0；设置保存、12 条图鉴、8 项暂停属性、升级 / 换选、地图角落 / 画外巨蛾、结算足迹与同种子重试通过；完整 7 模块版本参数一致，无检测到的页面 / 资源错误。
- 构建验证 `build-verification-v1.3.json`、公网验证 `online-verification-v1.3.json`、五种尺寸的 25 个面板状态 `layout-verification-v1.3.json` 已保存。
- GitHub 与 Gitee 的 main 均同步；版本页：https://github.com/yunhanhai/mosslight/releases/tag/v1.3.0。
- 原最高成绩和音效偏好保留，新增本地设置与最近八局足迹，不包含云存档。真实 iOS 和低端设备人工验证仍未完成。

## v1.2.0 发布验证

- 游戏提交：`8ecbc38e1c7a78acf29c76d1dec74de7097d9976`。
- Linux / Chromium Checks：https://github.com/yunhanhai/mosslight/actions/runs/44897444469 — success。
- Pages 部署：https://github.com/yunhanhai/mosslight/actions/runs/44897444479 — success。
- 本地 35 项逻辑 / 构建测试、31 项浏览器流程通过；3 项手机专用用例在桌面跳过。
- 公网桌面 / 手机均返回 1.2.0，实测三选一、一次换选、暂停 / 继续、角落角色安全取景与画外巨蛾提示；所有模块使用统一版本号，无检测到的页面或资源错误。
- 构建验证：build-verification-v1.2.json；公网验证：online-verification-v1.2.json。
- 版本发布页：https://github.com/yunhanhai/mosslight/releases/tag/v1.2.0
- 本地记录 key 未改变。真实 iOS / 低端设备人工验证仍待完成。

## 远端

- GitHub：https://github.com/yunhanhai/mosslight
- Gitee：https://gitee.com/yunhanhai/mosslight
- 在线试玩：https://yunhanhai.github.io/mosslight/

## v1.1.0 发布验证

- 游戏改进提交：`6517208c056fcaa59fd008f088340527fc048de9`。
- 部署产物可见性修复：`55b8108af6b77fe70d3ba6e2755daa5c8c4575e0`；仅调整发布流程，游戏代码未改。
- Linux / Chromium Checks： https://github.com/yunhanhai/mosslight/actions/runs/44893121241 — success。
- Pages 部署： https://github.com/yunhanhai/mosslight/actions/runs/44893121228 — success。
- 公网版本接口返回 `1.1.0`，桌面 / 手机均验证了进入游戏、3 个带数值预览的能力、选择能力及暂停；5 个游戏模块都带统一版本号。
- 原始验证记录：`online-verification-v1.1.json`；构建验证：`build-verification.json`；优化 A/B 指标：`optimization-v1.1.json`。
- 本地：25 项逻辑 / 构建测试通过，23 项浏览器流程通过，3 项手机专用用例在桌面跳过；截图覆盖四种尺寸与升级、结算、巨蛾蓄力。
- 版本发布页：https://github.com/yunhanhai/mosslight/releases/tag/v1.1.0
- 此次保留原有花园视觉与本地记录。真实 iOS / 低端设备人工验证仍待完成，详见 TESTING.md。

## 首次发布验证

- 游戏代码提交：`458683c89e05f9c2072728d572acad0115deb4d6`。该首版的随后一条提交仅更新说明和验证资料；v1.1 变更见上节。
- CI：https://github.com/yunhanhai/mosslight/actions/runs/44882761129 — success。
- Pages：https://github.com/yunhanhai/mosslight/actions/runs/44882761134 — attempt 2 success。
- 首次 Pages 任务因站点尚未启用而在 configure-pages 步骤失败，启用工作流型 Pages 后重跑成功，没有为绕过问题修改游戏。
- Gitee 初次创建时为私有，平台明确拒绝空仓库公开；首次推送后设置公开成功，已用未携带凭据的请求验证。
- 线上浏览器验证：桌面与手机均加载本地字体与脚本、进入游戏、显示三选一能力、选择后继续、暂停 / 继续；没有页面错误或资源 HTTP 错误。原始结果在 `online-verification.json`。

## 发布约定

v1.3 首次部署在构建、上传和 REST 可见性检查均成功后，`deploy-pages@v4` 的任务内发现仍返回 0。现保留原有权限和 OIDC 身份校验，使用 `upload-pages-artifact` 返回的精确 ID，通过与官方 action 相同的 Pages REST 创建 / 查询 / 取消接口发布；等待最多十分钟，失败取消未完成任务。不使用个人令牌作为工作流部署凭据。官方实现参考：https://github.com/actions/deploy-pages/blob/v4/src/internal/api-client.js；上传输出定义：https://github.com/actions/upload-pages-artifact/blob/v3/action.yml。

- GitHub remote 名称 `origin`，Gitee remote 名称 `gitee`；主分支 `main`。
- 构建产物 `dist/` 不进入源码 Git；GitHub Pages 从工作流上传静态构建。
- 首次发布前执行测试、构建、截图、许可核对和暂存区凭据模式检查。
- 不使用强制推送，不覆盖既有不相关仓库。创建前已确认两端同名仓库不存在。
- 凭据通过本机原有 Git credential helper 临时读取，API 验证成功；未输出或写入令牌，remote 使用普通 HTTPS URL。
- 页面公开状态、CI 成功、在线可访问性分别验证；不能用“仓库创建”代替“代码推送”或“网页部署”。

## 后续更新

```powershell
npm test
npm run test:browser
npm run build
git add .
git commit -m "Describe the change"
git push origin main
git push gitee main
```

GitHub Pages 工作流会在推送 main 后部署。源码、文档与镜像需要同时推送两端，Gitee 不会自动接收 GitHub 的后续更新。
