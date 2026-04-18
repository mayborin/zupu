import { useState, useCallback, useRef, useEffect, useMemo } from "react";

// ─── Data Helpers ───
const uid = () => Math.random().toString(36).slice(2, 10);

const SAMPLE_DATA = {
  members: [],
  families: [],
};

// ─── Main App ───
export default function FamilyTreeApp() {
  const [phase, setPhase] = useState("input"); // input | tree
  const [members, setMembers] = useState([]);
  const [families, setFamilies] = useState([]);
  const [editModal, setEditModal] = useState(null); // null | { type, data }
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const findExistingMember = (name, birthYear) => {
    return members.find(
      (m) => m.name === name && m.birthYear === birthYear
    );
  };

  const addMember = (m) => {
    // Auto-dedup: same name + same birthYear = same person
    const by = m.birthYear || null;
    const existing = members.find(
      (em) => em.name === m.name && em.birthYear === by
    );
    if (existing) {
      return existing;
    }
    const newM = { ...m, id: uid() };
    setMembers((prev) => [...prev, newM]);
    return newM;
  };

  const updateMember = (id, data) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...data } : m)));
  };

  const deleteMember = (id) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setFamilies((prev) =>
      prev
        .map((f) => ({
          ...f,
          fatherId: f.fatherId === id ? null : f.fatherId,
          motherId: f.motherId === id ? null : f.motherId,
          childrenIds: f.childrenIds.filter((c) => c !== id),
        }))
        .filter((f) => f.fatherId || f.motherId || f.childrenIds.length > 0)
    );
  };

  const addFamily = (f) => {
    setFamilies((prev) => [...prev, { ...f, id: uid() }]);
  };

  const updateFamily = (id, data) => {
    setFamilies((prev) => prev.map((f) => (f.id === id ? { ...f, ...data } : f)));
  };

  const deleteFamily = (id) => {
    setFamilies((prev) => prev.filter((f) => f.id !== id));
  };

  const [exportJson, setExportJson] = useState(null);

  const exportData = () => {
    const data = JSON.stringify({ members, families }, null, 2);
    setExportJson(data);
  };

  const importData = (jsonStr) => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.members || !data.families) {
        showToast("无效的族谱数据文件", "error");
        return;
      }
      setMembers(data.members);
      setFamilies(data.families);
      showToast(`已导入 ${data.members.length} 位成员，${data.families.length} 个家庭`);
    } catch (e) {
      showToast("文件解析失败，请检查格式", "error");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0a0a0f 0%, #121218 40%, #0d1117 100%)",
      color: "#e8e6e3",
      fontFamily: "'Noto Serif SC', 'Noto Serif', Georgia, serif",
      position: "relative",
      overflow: "hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700;900&family=Ma+Shan+Zheng&family=ZCOOL+XiaoWei&display=swap" rel="stylesheet" />

      {/* Background texture */}
      <div style={{
        position: "fixed", inset: 0, opacity: 0.03,
        backgroundImage: `radial-gradient(circle at 20% 50%, #c9a96e 1px, transparent 1px),
                          radial-gradient(circle at 80% 20%, #c9a96e 1px, transparent 1px)`,
        backgroundSize: "60px 60px, 80px 80px",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <header style={{
        textAlign: "center",
        padding: "32px 20px 16px",
        position: "relative",
        zIndex: 2,
      }}>
        <div style={{
          fontSize: "12px",
          letterSpacing: "6px",
          color: "#c9a96e",
          textTransform: "uppercase",
          marginBottom: "8px",
          fontFamily: "'ZCOOL XiaoWei', serif",
        }}>家族传承 · 世代相连</div>
        <h1 style={{
          fontSize: "clamp(28px, 5vw, 42px)",
          fontWeight: 900,
          background: "linear-gradient(135deg, #f0e6d3, #c9a96e, #8b7355)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          margin: 0,
          fontFamily: "'Ma Shan Zheng', cursive",
          letterSpacing: "4px",
        }}>族 谱</h1>
        <div style={{
          width: "80px", height: "2px",
          background: "linear-gradient(90deg, transparent, #c9a96e, transparent)",
          margin: "12px auto 0",
        }} />
      </header>

      {/* Phase tabs */}
      <div style={{
        display: "flex", justifyContent: "center", gap: "4px",
        padding: "0 20px 20px",
        position: "relative", zIndex: 2,
      }}>
        {[
          { key: "input", label: "录入信息", icon: "✦" },
          { key: "tree", label: "族谱图", icon: "❋" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setPhase(tab.key)}
            style={{
              padding: "10px 28px",
              background: phase === tab.key
                ? "linear-gradient(135deg, #c9a96e, #a88b5e)"
                : "rgba(201,169,110,0.08)",
              color: phase === tab.key ? "#0a0a0f" : "#c9a96e",
              border: `1px solid ${phase === tab.key ? "#c9a96e" : "rgba(201,169,110,0.2)"}`,
              borderRadius: "6px",
              cursor: "pointer",
              fontFamily: "'Noto Serif SC', serif",
              fontWeight: 600,
              fontSize: "14px",
              transition: "all 0.3s",
              letterSpacing: "2px",
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "success" ? "#2d5a3d" : "#5a2d2d",
          color: "#e8e6e3",
          padding: "12px 28px",
          borderRadius: "8px",
          zIndex: 1000,
          fontSize: "14px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          border: `1px solid ${toast.type === "success" ? "#4a8c62" : "#8c4a4a"}`,
          animation: "fadeIn 0.3s ease",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, paddingBottom: "40px" }}>
        {phase === "input" && (
          <InputPhase
            members={members}
            families={families}
            addMember={addMember}
            updateMember={updateMember}
            deleteMember={deleteMember}
            addFamily={addFamily}
            updateFamily={updateFamily}
            deleteFamily={deleteFamily}
            showToast={showToast}
            goToTree={() => setPhase("tree")}
            importData={importData}
          />
        )}
        {phase === "tree" && (
          <TreePhase
            members={members}
            families={families}
            addMember={addMember}
            updateMember={updateMember}
            deleteMember={deleteMember}
            addFamily={addFamily}
            updateFamily={updateFamily}
            deleteFamily={deleteFamily}
            showToast={showToast}
            exportData={exportData}
            setEditModal={setEditModal}
          />
        )}
      </div>

      {/* Export JSON Modal */}
      {exportJson && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 200, padding: "20px",
        }} onClick={() => setExportJson(null)}>
          <div style={{
            background: "#121218", border: "1px solid rgba(201,169,110,0.2)",
            borderRadius: "12px", padding: "24px", maxWidth: "520px", width: "100%",
            boxShadow: "0 16px 64px rgba(0,0,0,0.6)",
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 8px", color: "#c9a96e", fontSize: "18px", letterSpacing: "2px" }}>导出族谱数据</h3>
            <p style={{ fontSize: "13px", color: "#888", margin: "0 0 12px" }}>
              复制以下 JSON 数据保存为 .json 文件，后续可通过「导入族谱数据」恢复
            </p>
            <textarea
              readOnly
              value={exportJson}
              style={{
                width: "100%", height: "260px", padding: "12px",
                background: "rgba(0,0,0,0.4)", border: "1px solid rgba(201,169,110,0.15)",
                borderRadius: "8px", color: "#e8e6e3", fontSize: "12px",
                fontFamily: "monospace", resize: "vertical", outline: "none",
              }}
              onFocus={(e) => e.target.select()}
            />
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <button style={{
                padding: "10px 24px", background: "linear-gradient(135deg, #c9a96e, #a88b5e)",
                color: "#0a0a0f", border: "none", borderRadius: "6px", cursor: "pointer",
                fontWeight: 700, fontSize: "14px", fontFamily: "'Noto Serif SC', serif",
              }} onClick={() => {
                navigator.clipboard?.writeText(exportJson).then(() => {
                  showToast("已复制到剪贴板");
                }).catch(() => {
                  showToast("请手动选中并复制", "error");
                });
              }}>
                📋 复制到剪贴板
              </button>
              <button style={{
                padding: "10px 24px", background: "rgba(201,169,110,0.1)",
                color: "#c9a96e", border: "1px solid rgba(201,169,110,0.3)",
                borderRadius: "6px", cursor: "pointer", fontWeight: 700, fontSize: "14px",
                fontFamily: "'Noto Serif SC', serif",
              }} onClick={() => setExportJson(null)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform: translateX(-50%) translateY(-10px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        ::-webkit-scrollbar-thumb { background: #c9a96e44; border-radius: 3px; }
      `}</style>
    </div>
  );
}

// ─── Shared Styles ───
const cardStyle = {
  background: "rgba(201,169,110,0.04)",
  border: "1px solid rgba(201,169,110,0.15)",
  borderRadius: "10px",
  padding: "20px",
  marginBottom: "16px",
};

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  background: "rgba(0,0,0,0.3)",
  border: "1px solid rgba(201,169,110,0.2)",
  borderRadius: "6px",
  color: "#e8e6e3",
  fontSize: "14px",
  fontFamily: "'Noto Serif SC', serif",
  outline: "none",
  transition: "border-color 0.2s",
};

const btnPrimary = {
  padding: "10px 24px",
  background: "linear-gradient(135deg, #c9a96e, #a88b5e)",
  color: "#0a0a0f",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "14px",
  fontFamily: "'Noto Serif SC', serif",
  letterSpacing: "1px",
  transition: "all 0.2s",
};

const btnSecondary = {
  ...btnPrimary,
  background: "rgba(201,169,110,0.1)",
  color: "#c9a96e",
  border: "1px solid rgba(201,169,110,0.3)",
};

const btnDanger = {
  ...btnPrimary,
  background: "rgba(180,60,60,0.2)",
  color: "#e07070",
  border: "1px solid rgba(180,60,60,0.3)",
  fontWeight: 600,
};

const labelStyle = {
  display: "block",
  fontSize: "12px",
  color: "#c9a96e",
  marginBottom: "6px",
  letterSpacing: "1px",
  fontWeight: 600,
};

// ─── Input Phase ───
function InputPhase({ members, families, addMember, updateMember, deleteMember, addFamily, updateFamily, deleteFamily, showToast, goToTree, importData }) {
  const [step, setStep] = useState("menu");
  const [editingMember, setEditingMember] = useState(null);
  const [editingFamilyId, setEditingFamilyId] = useState(null);
  const [memberDraft, setMemberDraft] = useState({ name: "", gender: "male", birthYear: "" });
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const fileInputRef = useRef(null);

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      setImportText(text);
      // Auto-import immediately after file is read
      importData(text);
      setShowImportModal(false);
      setImportText("");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleConfirmImport = () => {
    if (!importText.trim()) { showToast("请粘贴或选择 JSON 数据", "error"); return; }
    importData(importText);
    setShowImportModal(false);
    setImportText("");
  };

  // Family draft — inline form fields for father, mother, children
  const [fatherDraft, setFatherDraft] = useState({ name: "", birthYear: "" });
  const [motherDraft, setMotherDraft] = useState({ name: "", birthYear: "" });
  const [childrenList, setChildrenList] = useState([]); // [{name, gender, birthYear, tempId}]
  const [childDraft, setChildDraft] = useState({ name: "", gender: "male", birthYear: "" });
  const [showChildForm, setShowChildForm] = useState(false);
  // For selecting existing members
  const [selectingRole, setSelectingRole] = useState(null);
  // Track if father/mother uses existing member
  const [fatherExisting, setFatherExisting] = useState(null); // member obj or null
  const [motherExisting, setMotherExisting] = useState(null);

  const resetFamilyDraft = () => {
    setFatherDraft({ name: "", birthYear: "" });
    setMotherDraft({ name: "", birthYear: "" });
    setChildrenList([]);
    setChildDraft({ name: "", gender: "male", birthYear: "" });
    setShowChildForm(false);
    setSelectingRole(null);
    setFatherExisting(null);
    setMotherExisting(null);
  };

  const loadFamilyForEdit = (f) => {
    const father = getMemberById(f.fatherId);
    const mother = getMemberById(f.motherId);
    const children = f.childrenIds.map(getMemberById).filter(Boolean);
    if (father) {
      setFatherDraft({ name: father.name, birthYear: father.birthYear || "" });
      setFatherExisting(father);
    } else {
      setFatherDraft({ name: "", birthYear: "" });
      setFatherExisting(null);
    }
    if (mother) {
      setMotherDraft({ name: mother.name, birthYear: mother.birthYear || "" });
      setMotherExisting(mother);
    } else {
      setMotherDraft({ name: "", birthYear: "" });
      setMotherExisting(null);
    }
    setChildrenList(children.map((c) => ({
      name: c.name,
      gender: c.gender,
      birthYear: c.birthYear || "",
      tempId: c.id,
      existingId: c.id,
    })));
  };

  const handleAddChildToList = () => {
    if (!childDraft.name.trim()) return;
    // Check if already in list
    if (childrenList.some((c) => c.name === childDraft.name.trim() && String(c.birthYear) === String(childDraft.birthYear))) {
      showToast("该子女已在列表中", "error");
      return;
    }
    setChildrenList((prev) => [...prev, {
      name: childDraft.name.trim(),
      gender: childDraft.gender,
      birthYear: childDraft.birthYear,
      tempId: Math.random().toString(36).slice(2, 10),
    }]);
    setChildDraft({ name: "", gender: "male", birthYear: "" });
    // Keep form open for adding more children
  };

  const handleSaveFamily = () => {
    const hasFather = fatherExisting || fatherDraft.name.trim();
    const hasMother = motherExisting || motherDraft.name.trim();
    if (!hasFather && !hasMother) {
      showToast("请至少填写父亲或母亲信息", "error");
      return;
    }

    // Resolve father
    let fatherMember = null;
    if (fatherExisting) {
      fatherMember = fatherExisting;
    } else if (fatherDraft.name.trim()) {
      fatherMember = addMember({
        name: fatherDraft.name.trim(),
        gender: "male",
        birthYear: fatherDraft.birthYear ? parseInt(fatherDraft.birthYear) : null,
      });
    }

    // Resolve mother
    let motherMember = null;
    if (motherExisting) {
      motherMember = motherExisting;
    } else if (motherDraft.name.trim()) {
      motherMember = addMember({
        name: motherDraft.name.trim(),
        gender: "female",
        birthYear: motherDraft.birthYear ? parseInt(motherDraft.birthYear) : null,
      });
    }

    // Resolve children
    const childMembers = childrenList.map((c) => {
      if (c.existingId) {
        return members.find((m) => m.id === c.existingId) || addMember({
          name: c.name, gender: c.gender, birthYear: c.birthYear ? parseInt(c.birthYear) : null,
        });
      }
      return addMember({
        name: c.name, gender: c.gender, birthYear: c.birthYear ? parseInt(c.birthYear) : null,
      });
    });

    const familyData = {
      fatherId: fatherMember?.id || null,
      motherId: motherMember?.id || null,
      childrenIds: childMembers.map((c) => c.id),
    };

    if (editingFamilyId) {
      updateFamily(editingFamilyId, familyData);
      showToast("家庭已更新！");
      setEditingFamilyId(null);
    } else {
      addFamily(familyData);
      showToast("家庭创建成功！");
    }
    resetFamilyDraft();
    setStep("menu");
  };

  const getMemberById = (id) => members.find((m) => m.id === id);

  const containerStyle = {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "0 20px",
  };

  // ─── Render helper for parent input (NOT a component, just a function returning JSX) ───
  const renderParentRow = (role, draft, setDraft, existing, setExisting, label, icon, color, bgColor, borderColor) => {
    const isSelecting = selectingRole === role;
    const availableMembers = members.filter((m) =>
      m.gender === (role === "father" ? "male" : "female")
    );

    if (existing) {
      return (
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>{icon} {label}</label>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{
              padding: "8px 14px", flex: 1, fontSize: "14px",
              background: bgColor, border: `1px solid ${borderColor}`,
              borderRadius: "6px", color,
            }}>
              {role === "father" ? "♂" : "♀"} {existing.name} {existing.birthYear ? `(${existing.birthYear})` : ""}
              <span style={{ fontSize: "11px", color: "#888", marginLeft: "6px" }}>已有成员</span>
            </span>
            <button style={{ ...btnDanger, padding: "6px 10px", fontSize: "12px" }}
              onClick={() => { setExisting(null); setDraft({ name: "", birthYear: "" }); }}>
              清除
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <label style={{ ...labelStyle, margin: 0 }}>{icon} {label}</label>
          {availableMembers.length > 0 && (
            <button
              style={{
                background: "none", border: "none", color: "#c9a96e", fontSize: "12px",
                cursor: "pointer", textDecoration: "underline", fontFamily: "'Noto Serif SC', serif",
              }}
              onClick={() => setSelectingRole(isSelecting ? null : role)}
            >
              {isSelecting ? "取消选择" : "从已有成员选择"}
            </button>
          )}
        </div>

        {isSelecting ? (
          <div style={{
            maxHeight: "150px", overflowY: "auto",
            background: "rgba(0,0,0,0.3)", borderRadius: "6px", padding: "4px",
          }}>
            {availableMembers.map((m) => (
              <div key={m.id}
                onClick={() => {
                  setExisting(m);
                  setDraft({ name: m.name, birthYear: m.birthYear || "" });
                  setSelectingRole(null);
                }}
                style={{
                  padding: "8px 12px", cursor: "pointer", borderRadius: "4px",
                  fontSize: "13px", color: "#e8e6e3", transition: "background 0.15s",
                }}
                onMouseEnter={(e) => e.target.style.background = "rgba(201,169,110,0.1)"}
                onMouseLeave={(e) => e.target.style.background = "transparent"}
              >
                {m.gender === "male" ? "♂" : "♀"} {m.name} {m.birthYear ? `(${m.birthYear})` : ""}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 150px", gap: "8px" }}>
            <div>
              <input
                style={inputStyle}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder={`${label}姓名`}
              />
            </div>
            <div>
              <YearPicker value={draft.birthYear} onChange={(v) => setDraft({ ...draft, birthYear: v })} compact />
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─── Import Modal (takes priority over all steps) ───
  if (showImportModal) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "20px" }}
        onClick={() => setShowImportModal(false)}>
        <div style={{
          background: "#121218", border: "1px solid rgba(201,169,110,0.2)",
          borderRadius: "12px", padding: "24px", maxWidth: "520px", width: "100%",
          boxShadow: "0 16px 64px rgba(0,0,0,0.6)",
        }} onClick={(e) => e.stopPropagation()}>
          <h3 style={{ margin: "0 0 8px", color: "#c9a96e", fontSize: "18px", letterSpacing: "2px" }}>导入族谱数据</h3>
          <p style={{ fontSize: "13px", color: "#888", margin: "0 0 12px" }}>
            方式一：点击「选择文件」选择 .json 文件自动导入<br/>
            方式二：将 JSON 数据粘贴到下方文本框，点击「确认导入」
          </p>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <button style={{
              flex: 1, padding: "12px 20px", background: "linear-gradient(135deg, #c9a96e, #a88b5e)",
              color: "#0a0a0f", border: "none", borderRadius: "6px", cursor: "pointer",
              fontWeight: 700, fontSize: "14px", fontFamily: "'Noto Serif SC', serif",
            }} onClick={() => fileInputRef.current?.click()}>
              📁 选择 JSON 文件导入
            </button>
            <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImportFile} />
          </div>
          <div style={{ textAlign: "center", fontSize: "12px", color: "#666", margin: "4px 0 12px" }}>— 或粘贴 JSON 数据 —</div>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='将 JSON 数据粘贴到这里...'
            style={{
              width: "100%", height: "160px", padding: "12px",
              background: "rgba(0,0,0,0.4)", border: "1px solid rgba(201,169,110,0.15)",
              borderRadius: "8px", color: "#e8e6e3", fontSize: "12px",
              fontFamily: "monospace", resize: "vertical", outline: "none",
            }}
          />
          <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
            <button style={{
              padding: "10px 20px", background: importText.trim() ? "linear-gradient(135deg, #5a8f4a, #3d6b33)" : "rgba(201,169,110,0.1)",
              color: importText.trim() ? "#fff" : "#888", border: "none", borderRadius: "6px",
              cursor: importText.trim() ? "pointer" : "not-allowed",
              fontWeight: 700, fontSize: "14px", fontFamily: "'Noto Serif SC', serif",
            }} onClick={handleConfirmImport} disabled={!importText.trim()}>
              ✓ 确认导入
            </button>
            <button style={{
              padding: "10px 20px", background: "rgba(201,169,110,0.1)",
              color: "#c9a96e", border: "1px solid rgba(201,169,110,0.3)",
              borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "14px",
              fontFamily: "'Noto Serif SC', serif",
            }} onClick={() => setShowImportModal(false)}>
              取消
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Menu ───
  if (step === "menu") {
    return (
      <div style={containerStyle}>
        <div style={{ ...cardStyle, textAlign: "center", padding: "32px" }}>
          <div style={{ fontSize: "16px", color: "#c9a96e88", marginBottom: "20px" }}>
            当前已录入 <strong style={{ color: "#c9a96e" }}>{members.length}</strong> 位成员，
            <strong style={{ color: "#c9a96e" }}>{families.length}</strong> 个家庭
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "320px", margin: "0 auto" }}>
            <button style={btnPrimary} onClick={() => { resetFamilyDraft(); setEditingFamilyId(null); setStep("addFamily"); }}>
              ＋ 添加一个家庭
            </button>
            <button style={btnSecondary} onClick={() => setStep("addMember")}>
              ＋ 添加单个成员
            </button>
            {families.length > 0 && (
              <button style={btnSecondary} onClick={() => setStep("familyList")}>
                📋 查看所有家庭 ({families.length})
              </button>
            )}
            {members.length > 0 && (
              <button style={btnSecondary} onClick={() => setStep("memberList")}>
                👥 查看所有成员 ({members.length})
              </button>
            )}
            {members.length >= 2 && (
              <button
                style={{ ...btnPrimary, background: "linear-gradient(135deg, #5a8f4a, #3d6b33)", color: "#fff", marginTop: "8px" }}
                onClick={goToTree}
              >
                🌳 生成族谱图 →
              </button>
            )}
            <button style={{ ...btnSecondary, marginTop: "4px" }} onClick={() => { setImportText(""); setShowImportModal(true); }}>
              📥 导入族谱数据
            </button>
          </div>
        </div>

        {members.length > 0 && (
          <div style={{ ...cardStyle, padding: "16px" }}>
            <div style={{ fontSize: "12px", color: "#c9a96e88", letterSpacing: "2px", marginBottom: "12px" }}>最近添加的成员</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {members.slice(-8).map((m) => (
                <span key={m.id} style={{
                  padding: "4px 12px",
                  background: m.gender === "male" ? "rgba(100,149,237,0.15)" : "rgba(219,112,147,0.15)",
                  border: `1px solid ${m.gender === "male" ? "rgba(100,149,237,0.3)" : "rgba(219,112,147,0.3)"}`,
                  borderRadius: "20px", fontSize: "13px",
                  color: m.gender === "male" ? "#8ab4f8" : "#f0a0b8",
                }}>
                  {m.gender === "male" ? "♂" : "♀"} {m.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Add / Edit Family (unified inline form) ───
  if (step === "addFamily") {
    return (
      <div style={containerStyle}>
        <button style={{ ...btnSecondary, marginBottom: "16px", padding: "8px 16px", fontSize: "13px" }}
          onClick={() => { resetFamilyDraft(); setEditingFamilyId(null); setStep("menu"); }}>
          ← 返回
        </button>

        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 6px", color: "#c9a96e", fontSize: "18px", letterSpacing: "2px" }}>
            {editingFamilyId ? "编辑家庭" : "添加家庭"}
          </h3>
          <div style={{ fontSize: "12px", color: "#888", marginBottom: "20px" }}>
            直接填写姓名和出生年份，同名同年份自动识别为同一人
          </div>

          {/* ── Father ── */}
          {renderParentRow(
            "father", fatherDraft, setFatherDraft, fatherExisting, setFatherExisting,
            "父亲", "👨", "#8ab4f8", "rgba(100,149,237,0.15)", "rgba(100,149,237,0.3)"
          )}

          {/* ── Mother ── */}
          {renderParentRow(
            "mother", motherDraft, setMotherDraft, motherExisting, setMotherExisting,
            "母亲", "👩", "#f0a0b8", "rgba(219,112,147,0.15)", "rgba(219,112,147,0.3)"
          )}

          {/* ── Divider ── */}
          <div style={{
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(201,169,110,0.2), transparent)",
            margin: "8px 0 16px",
          }} />

          {/* ── Children ── */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>👶 子女</label>

            {childrenList.length === 0 && !showChildForm && (
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "8px", fontStyle: "italic" }}>
                暂无子女，点击下方按钮添加
              </div>
            )}

            {childrenList.map((c, i) => (
              <div key={c.tempId} style={{
                display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px",
              }}>
                <span style={{
                  padding: "7px 14px", flex: 1, fontSize: "13px",
                  background: c.gender === "male" ? "rgba(100,149,237,0.1)" : "rgba(219,112,147,0.1)",
                  border: `1px solid ${c.gender === "male" ? "rgba(100,149,237,0.2)" : "rgba(219,112,147,0.2)"}`,
                  borderRadius: "6px",
                  color: c.gender === "male" ? "#8ab4f8" : "#f0a0b8",
                }}>
                  {c.gender === "male" ? "♂" : "♀"} {c.name} {c.birthYear ? `(${c.birthYear})` : ""}
                </span>
                <button style={{ ...btnDanger, padding: "6px 10px", fontSize: "11px" }}
                  onClick={() => setChildrenList((p) => p.filter((_, j) => j !== i))}>
                  ✕
                </button>
              </div>
            ))}

            {showChildForm ? (
              <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "14px", marginTop: "8px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 100px", gap: "8px", alignItems: "end" }}>
                  <div>
                    <label style={{ ...labelStyle, fontSize: "11px" }}>姓名</label>
                    <input style={inputStyle} value={childDraft.name}
                      onChange={(e) => setChildDraft((p) => ({ ...p, name: e.target.value }))}
                      placeholder="子女姓名"
                      onKeyDown={(e) => { if (e.key === "Enter") handleAddChildToList(); }}
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: "11px" }}>性别</label>
                    <div style={{ display: "flex" }}>
                      {[{ v: "male", l: "♂ 男", c: "#8ab4f8", bg: "rgba(100,149,237," },
                        { v: "female", l: "♀ 女", c: "#f0a0b8", bg: "rgba(219,112,147," }].map((o) => {
                        const s = childDraft.gender === o.v;
                        return (
                          <button key={o.v} type="button"
                            onClick={() => setChildDraft((p) => ({ ...p, gender: o.v }))}
                            style={{
                              flex: 1, padding: "8px 0", fontSize: "12px", cursor: "pointer",
                              fontFamily: "'Noto Serif SC', serif", fontWeight: s ? 700 : 400,
                              background: s ? o.bg + "0.25)" : "rgba(0,0,0,0.2)",
                              color: s ? o.c : "#666",
                              border: `1px solid ${s ? o.bg + "0.5)" : "rgba(201,169,110,0.15)"}`,
                              borderRadius: o.v === "male" ? "6px 0 0 6px" : "0 6px 6px 0",
                            }}
                          >{o.l}</button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: "11px" }}>出生年份</label>
                    <YearPicker value={childDraft.birthYear}
                      onChange={(v) => setChildDraft((p) => ({ ...p, birthYear: v }))}
                      compact
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                  <button style={{ ...btnPrimary, fontSize: "13px", padding: "8px 16px" }} onClick={handleAddChildToList}>
                    确认
                  </button>
                  <button style={{ ...btnSecondary, fontSize: "13px", padding: "8px 16px" }} onClick={() => setShowChildForm(false)}>
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <button style={{ ...btnSecondary, marginTop: "4px", width: "100%", fontSize: "13px" }}
                onClick={() => setShowChildForm(true)}>
                ＋ 添加子女
              </button>
            )}
          </div>

          {/* ── Save / Cancel ── */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button style={btnPrimary} onClick={handleSaveFamily}>
              ✓ {editingFamilyId ? "保存修改" : "保存家庭"}
            </button>
            <button style={btnSecondary} onClick={() => { resetFamilyDraft(); setEditingFamilyId(null); setStep("menu"); }}>
              取消
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Add Member (standalone) ───
  if (step === "addMember") {
    return (
      <div style={containerStyle}>
        <button style={{ ...btnSecondary, marginBottom: "16px", padding: "8px 16px", fontSize: "13px" }} onClick={() => setStep("menu")}>← 返回</button>
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 16px", color: "#c9a96e", fontSize: "18px", letterSpacing: "2px" }}>添加成员</h3>
          <MemberForm
            draft={memberDraft}
            setDraft={setMemberDraft}
            onSave={() => {
              if (!memberDraft.name.trim()) { showToast("请输入姓名", "error"); return; }
              const by = memberDraft.birthYear ? parseInt(memberDraft.birthYear) : null;
              const existing = members.find((m) => m.name === memberDraft.name.trim() && m.birthYear === by);
              if (existing) {
                showToast(`「${existing.name}」已存在，自动识别为同一人`, "success");
              } else {
                addMember({
                  name: memberDraft.name.trim(),
                  gender: memberDraft.gender,
                  birthYear: by,
                });
                showToast(`已添加: ${memberDraft.name}`);
              }
              setMemberDraft({ name: "", gender: "male", birthYear: "" });
            }}
            onCancel={() => setStep("menu")}
          />
        </div>
      </div>
    );
  }

  // ─── Member List ───
  if (step === "memberList") {
    return (
      <div style={containerStyle}>
        <button style={{ ...btnSecondary, marginBottom: "16px", padding: "8px 16px", fontSize: "13px" }} onClick={() => setStep("menu")}>← 返回</button>
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 16px", color: "#c9a96e", fontSize: "18px", letterSpacing: "2px" }}>所有成员</h3>
          {members.map((m) => (
            <div key={m.id} style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "10px 12px", marginBottom: "6px",
              background: "rgba(0,0,0,0.15)", borderRadius: "6px",
              border: "1px solid rgba(201,169,110,0.08)",
            }}>
              <span style={{
                width: "28px", height: "28px", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: m.gender === "male" ? "rgba(100,149,237,0.2)" : "rgba(219,112,147,0.2)",
                color: m.gender === "male" ? "#8ab4f8" : "#f0a0b8",
                fontSize: "14px", flexShrink: 0,
              }}>
                {m.gender === "male" ? "♂" : "♀"}
              </span>
              <span style={{ flex: 1, fontSize: "14px" }}>{m.name}</span>
              <span style={{ fontSize: "12px", color: "#888" }}>{m.birthYear || "—"}</span>
              <button style={{ ...btnSecondary, padding: "4px 10px", fontSize: "11px" }}
                onClick={() => { setEditingMember({ ...m }); setStep("editMember"); }}>
                编辑
              </button>
              <button style={{ ...btnDanger, padding: "4px 10px", fontSize: "11px" }}
                onClick={() => { deleteMember(m.id); showToast(`已删除: ${m.name}`); }}>
                删除
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Edit Member ───
  if (step === "editMember" && editingMember) {
    return (
      <div style={containerStyle}>
        <button style={{ ...btnSecondary, marginBottom: "16px", padding: "8px 16px", fontSize: "13px" }} onClick={() => setStep("memberList")}>← 返回</button>
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 16px", color: "#c9a96e", fontSize: "18px" }}>编辑成员</h3>
          <MemberForm
            draft={{ name: editingMember.name, gender: editingMember.gender, birthYear: editingMember.birthYear || "" }}
            setDraft={(d) => setEditingMember((p) => ({ ...p, ...(typeof d === "function" ? d(p) : d) }))}
            onSave={() => {
              updateMember(editingMember.id, {
                name: editingMember.name,
                gender: editingMember.gender,
                birthYear: editingMember.birthYear ? parseInt(editingMember.birthYear) : null,
              });
              showToast("已更新");
              setStep("memberList");
            }}
            onCancel={() => setStep("memberList")}
            saveLabel="保存修改"
          />
        </div>
      </div>
    );
  }

  // ─── Family List ───
  if (step === "familyList") {
    return (
      <div style={containerStyle}>
        <button style={{ ...btnSecondary, marginBottom: "16px", padding: "8px 16px", fontSize: "13px" }} onClick={() => setStep("menu")}>← 返回</button>
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 16px", color: "#c9a96e", fontSize: "18px", letterSpacing: "2px" }}>所有家庭</h3>
          {families.map((f, idx) => {
            const father = getMemberById(f.fatherId);
            const mother = getMemberById(f.motherId);
            const children = f.childrenIds.map(getMemberById).filter(Boolean);
            return (
              <div key={f.id} style={{
                padding: "14px", marginBottom: "10px",
                background: "rgba(0,0,0,0.15)", borderRadius: "8px",
                border: "1px solid rgba(201,169,110,0.08)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "13px", color: "#c9a96e88" }}>家庭 {idx + 1}</span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button style={{ ...btnSecondary, padding: "4px 10px", fontSize: "11px" }}
                      onClick={() => {
                        setEditingFamilyId(f.id);
                        loadFamilyForEdit(f);
                        setStep("addFamily");
                      }}>
                      编辑
                    </button>
                    <button style={{ ...btnDanger, padding: "4px 10px", fontSize: "11px" }}
                      onClick={() => { deleteFamily(f.id); showToast("已删除家庭"); }}>
                      删除
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: "14px", lineHeight: 1.8 }}>
                  {father && <div>👨 父: <span style={{ color: "#8ab4f8" }}>{father.name} {father.birthYear ? `(${father.birthYear})` : ""}</span></div>}
                  {mother && <div>👩 母: <span style={{ color: "#f0a0b8" }}>{mother.name} {mother.birthYear ? `(${mother.birthYear})` : ""}</span></div>}
                  {children.length > 0 && (
                    <div>👶 子女: {children.map((c) => (
                      <span key={c.id} style={{
                        color: c.gender === "male" ? "#8ab4f8" : "#f0a0b8",
                        marginRight: "8px",
                      }}>{c.name}</span>
                    ))}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}

// ─── Year Picker ───
function YearPicker({ value, onChange, placeholder = "出生年份", compact = false }) {
  const [open, setOpen] = useState(false);
  const [decade, setDecade] = useState(() => {
    if (value) return Math.floor(parseInt(value) / 10) * 10;
    return 1970;
  });
  const currentYear = new Date().getFullYear();
  const decades = [];
  for (let d = 1900; d <= Math.floor(currentYear / 10) * 10; d += 10) decades.push(d);
  const closeTimer = useRef(null);

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 600);
  };
  const cancelClose = () => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
  };

  const handleSelect = (yr) => {
    onChange(String(yr));
    setOpen(false);
  };

  const handleInputChange = (e) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 4);
    onChange(v);
    if (v.length === 4) {
      const n = parseInt(v);
      if (n >= 1900 && n <= currentYear) {
        setDecade(Math.floor(n / 10) * 10);
        // Auto-close after valid 4-digit year
        setTimeout(() => setOpen(false), 400);
      }
    }
  };

  const years = [];
  for (let y = decade; y < decade + 10 && y <= currentYear; y++) years.push(y);

  return (
    <div style={{ position: "relative" }}
      onMouseLeave={scheduleClose}
      onMouseEnter={cancelClose}
    >
      <div style={{ display: "flex", gap: "4px" }}>
        <input
          style={{ ...inputStyle, flex: 1, ...(compact ? { fontSize: "13px" } : {}) }}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          onFocus={() => { cancelClose(); setOpen(true); }}
        />
        <button
          type="button"
          style={{
            padding: "0 10px", background: "rgba(201,169,110,0.1)",
            border: "1px solid rgba(201,169,110,0.2)", borderRadius: "6px",
            color: "#c9a96e", cursor: "pointer", fontSize: "14px",
            flexShrink: 0,
          }}
          onClick={() => setOpen(!open)}
        >▾</button>
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
          marginTop: "4px", background: "rgba(15,15,22,0.98)",
          border: "1px solid rgba(201,169,110,0.2)", borderRadius: "8px",
          padding: "10px", boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          minWidth: "220px",
        }}>
          {/* Decade selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "8px" }}>
            <button type="button" onClick={() => setDecade((d) => Math.max(1900, d - 10))}
              style={{ background: "none", border: "none", color: "#c9a96e", cursor: "pointer", fontSize: "16px", padding: "2px 6px" }}>◂</button>
            <div style={{
              flex: 1, display: "flex", flexWrap: "wrap", gap: "3px", justifyContent: "center",
            }}>
              {decades.map((d) => (
                <button key={d} type="button" onClick={() => setDecade(d)}
                  style={{
                    padding: "3px 6px", fontSize: "11px", borderRadius: "4px", cursor: "pointer",
                    border: "none", fontFamily: "'Noto Serif SC', serif",
                    background: d === decade ? "#c9a96e" : "rgba(201,169,110,0.08)",
                    color: d === decade ? "#0a0a0f" : "#c9a96e88",
                    fontWeight: d === decade ? 700 : 400,
                  }}>
                  {d}s
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setDecade((d) => Math.min(Math.floor(currentYear / 10) * 10, d + 10))}
              style={{ background: "none", border: "none", color: "#c9a96e", cursor: "pointer", fontSize: "16px", padding: "2px 6px" }}>▸</button>
          </div>
          {/* Year grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "4px" }}>
            {years.map((yr) => (
              <button key={yr} type="button" onClick={() => handleSelect(yr)}
                style={{
                  padding: "8px 4px", fontSize: "13px", borderRadius: "6px", cursor: "pointer",
                  border: "1px solid transparent", fontFamily: "'Noto Serif SC', serif",
                  background: String(yr) === String(value)
                    ? "linear-gradient(135deg, #c9a96e, #a88b5e)"
                    : "rgba(201,169,110,0.06)",
                  color: String(yr) === String(value) ? "#0a0a0f" : "#e8e6e3",
                  fontWeight: String(yr) === String(value) ? 700 : 400,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { if (String(yr) !== String(value)) e.target.style.background = "rgba(201,169,110,0.15)"; }}
                onMouseLeave={(e) => { if (String(yr) !== String(value)) e.target.style.background = "rgba(201,169,110,0.06)"; }}
              >
                {yr}
              </button>
            ))}
          </div>
          {/* Quick clear */}
          {value && (
            <button type="button" onClick={() => { onChange(""); setOpen(false); }}
              style={{
                marginTop: "8px", width: "100%", padding: "6px",
                background: "rgba(180,60,60,0.1)", border: "1px solid rgba(180,60,60,0.2)",
                borderRadius: "6px", color: "#e07070", fontSize: "12px", cursor: "pointer",
                fontFamily: "'Noto Serif SC', serif",
              }}>清除年份</button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Member Form ───
function MemberForm({ draft, setDraft, onSave, onCancel, saveLabel = "添加", genderLocked = false }) {
  return (
    <div>
      <div style={{ marginBottom: "14px" }}>
        <label style={labelStyle}>姓名</label>
        <input
          style={inputStyle}
          value={draft.name}
          onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
          placeholder="请输入姓名"
          autoFocus
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: genderLocked ? "auto 1fr" : "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
        <div>
          <label style={labelStyle}>性别</label>
          {genderLocked ? (
            <div style={{
              padding: "9px 14px", borderRadius: "6px", fontSize: "13px",
              background: draft.gender === "male" ? "rgba(100,149,237,0.2)" : "rgba(219,112,147,0.2)",
              border: `1px solid ${draft.gender === "male" ? "rgba(100,149,237,0.4)" : "rgba(219,112,147,0.4)"}`,
              color: draft.gender === "male" ? "#8ab4f8" : "#f0a0b8",
              whiteSpace: "nowrap",
            }}>
              {draft.gender === "male" ? "♂男" : "♀女"}
            </div>
          ) : (
            <div style={{ display: "flex", gap: "0" }}>
              {[
                { value: "male", label: "♂ 男", color: "#8ab4f8", bg: "rgba(100,149,237,", border: "rgba(100,149,237," },
                { value: "female", label: "♀ 女", color: "#f0a0b8", bg: "rgba(219,112,147,", border: "rgba(219,112,147," },
              ].map((opt) => {
                const sel = draft.gender === opt.value;
                return (
                  <button key={opt.value} type="button"
                    onClick={() => setDraft((p) => ({ ...p, gender: opt.value }))}
                    style={{
                      flex: 1, padding: "9px 0", fontSize: "14px", cursor: "pointer",
                      fontFamily: "'Noto Serif SC', serif", fontWeight: sel ? 700 : 400,
                      background: sel ? opt.bg + "0.25)" : "rgba(0,0,0,0.2)",
                      color: sel ? opt.color : "#666",
                      border: `1px solid ${sel ? opt.border + "0.5)" : "rgba(201,169,110,0.15)"}`,
                      borderRadius: opt.value === "male" ? "6px 0 0 6px" : "0 6px 6px 0",
                      transition: "all 0.15s",
                    }}
                  >{opt.label}</button>
                );
              })}
            </div>
          )}
        </div>
        <div>
          <label style={labelStyle}>出生年份</label>
          <YearPicker value={draft.birthYear} onChange={(v) => setDraft((p) => ({ ...p, birthYear: v }))} />
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button style={btnPrimary} onClick={onSave}>{saveLabel}</button>
        <button style={btnSecondary} onClick={onCancel}>取消</button>
      </div>
    </div>
  );
}

// ─── Tree Phase ───
function TreePhase({ members, families, addMember, updateMember, deleteMember, addFamily, updateFamily, deleteFamily, showToast, exportData }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState(null);
  const [editingNode, setEditingNode] = useState(null);
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);

  // Build the tree layout
  const layout = useMemo(() => {
    if (members.length === 0) return { coupleCards: [], singleCards: [], links: [], width: 400, height: 300 };

    // ── Step 1: Build lookup maps ──
    const childInFamily = {};
    const parentInFamilies = {};
    families.forEach((f) => {
      f.childrenIds.forEach((cId) => { childInFamily[cId] = f.id; });
      if (f.fatherId) { if (!parentInFamilies[f.fatherId]) parentInFamilies[f.fatherId] = []; parentInFamilies[f.fatherId].push(f.id); }
      if (f.motherId) { if (!parentInFamilies[f.motherId]) parentInFamilies[f.motherId] = []; parentInFamilies[f.motherId].push(f.id); }
    });
    const familyById = {};
    families.forEach((f) => { familyById[f.id] = f; });

    // ── Step 2: Assign generations ──
    const childIdSet = new Set(families.flatMap((f) => f.childrenIds));
    const generation = {};
    const pureRoots = members.filter((m) => {
      if (childIdSet.has(m.id)) return false;
      const myFams = parentInFamilies[m.id] || [];
      let spouseIsChild = false;
      myFams.forEach((fId) => {
        const fam = familyById[fId];
        const sid = fam.fatherId === m.id ? fam.motherId : fam.fatherId;
        if (sid && childIdSet.has(sid)) spouseIsChild = true;
      });
      return !spouseIsChild;
    });
    pureRoots.forEach((r) => { generation[r.id] = 0; });
    const queue = pureRoots.map((r) => r.id);
    const visited = new Set();
    while (queue.length > 0) {
      const id = queue.shift();
      if (visited.has(id)) continue;
      visited.add(id);
      const gen = generation[id];
      (parentInFamilies[id] || []).forEach((fId) => {
        const fam = familyById[fId];
        const sid = fam.fatherId === id ? fam.motherId : fam.fatherId;
        if (sid && generation[sid] === undefined) { generation[sid] = gen; queue.push(sid); }
        fam.childrenIds.forEach((cId) => { if (generation[cId] === undefined) { generation[cId] = gen + 1; queue.push(cId); } });
      });
      const cFamId = childInFamily[id];
      if (cFamId) {
        const cFam = familyById[cFamId];
        if (cFam) {
          [cFam.fatherId, cFam.motherId].forEach((pId) => { if (pId && generation[pId] === undefined) { generation[pId] = gen - 1; queue.push(pId); } });
          cFam.childrenIds.forEach((sId) => { if (generation[sId] === undefined) { generation[sId] = gen; queue.push(sId); } });
        }
      }
    }
    members.forEach((m) => { if (generation[m.id] === undefined) generation[m.id] = 0; });
    const minGen = Math.min(...members.map((m) => generation[m.id]));
    if (minGen !== 0) members.forEach((m) => { generation[m.id] -= minGen; });

    // ── Step 3: Build "display units" — couple cards and single cards ──
    // A couple card is two spouses in one card. A single card is a lone person.
    // Each person appears in exactly one display unit.
    const inCouple = new Set(); // member ids that are part of a couple card
    const coupleUnits = []; // { type:'couple', fatherId, motherId, familyId, gen }
    const singleUnits = []; // { type:'single', memberId, gen }

    // Build couple units from families
    families.forEach((f) => {
      if (f.fatherId && f.motherId) {
        const g = generation[f.fatherId]; // both should be same gen
        if (!inCouple.has(f.fatherId) && !inCouple.has(f.motherId)) {
          coupleUnits.push({ type: 'couple', fatherId: f.fatherId, motherId: f.motherId, familyId: f.id, gen: g });
          inCouple.add(f.fatherId);
          inCouple.add(f.motherId);
        }
      }
    });

    // Single parent families or lone members
    members.forEach((m) => {
      if (!inCouple.has(m.id)) {
        singleUnits.push({ type: 'single', memberId: m.id, gen: generation[m.id] });
      }
    });

    const allUnits = [...coupleUnits, ...singleUnits];

    // ── Step 4: Sort units by generation, then by family order ──
    const COUPLE_W = 240;
    const SINGLE_W = 120;
    const CARD_H = 74;
    const H_GAP = 40;
    const V_GAP = 110;

    const genGroups = {};
    allUnits.forEach((u) => {
      if (!genGroups[u.gen]) genGroups[u.gen] = [];
      genGroups[u.gen].push(u);
    });
    const gens = Object.keys(genGroups).map(Number).sort((a, b) => a - b);

    const getUnitW = (u) => u.type === 'couple' ? COUPLE_W : SINGLE_W;
    const getUnitKey = (u) => u.type === 'couple' ? `c_${u.fatherId}_${u.motherId}` : `s_${u.memberId}`;

    // Sort units per generation: children cluster beneath their parents.
    // Multi-pass: first lay out parents, then sort children by parent index.

    // Pass 1: initial ordering — couples first by family order, then singles
    gens.forEach((g) => {
      const group = genGroups[g];
      const sorted = [];
      const placed = new Set();
      families.forEach((f) => {
        group.forEach((u) => {
          if (u.type === 'couple' && u.familyId === f.id && !placed.has(u)) {
            sorted.push(u); placed.add(u);
          }
        });
      });
      group.forEach((u) => { if (!placed.has(u)) { sorted.push(u); placed.add(u); } });
      genGroups[g] = sorted;
    });

    // Pass 2: re-sort each generation so children appear under their parents.
    // Build a temp index for each unit in its generation.
    const tempIdx = {};
    gens.forEach((g) => {
      genGroups[g].forEach((u, i) => { tempIdx[getUnitKey(u)] = i; });
    });

    // For each unit, compute sort priority = parent's index (children cluster under parent)
    const parentPriority = (u) => {
      const mids = u.type === 'couple' ? [u.fatherId, u.motherId] : [u.memberId];
      let best = Infinity;
      mids.forEach((mId) => {
        families.forEach((f) => {
          if (!f.childrenIds.includes(mId)) return;
          const pcu = coupleUnits.find((cu) => cu.familyId === f.id);
          if (pcu) best = Math.min(best, tempIdx[getUnitKey(pcu)] ?? Infinity);
          else {
            const pid = f.fatherId || f.motherId;
            const psu = pid && singleUnits.find((su) => su.memberId === pid);
            if (psu) best = Math.min(best, tempIdx[getUnitKey(psu)] ?? Infinity);
          }
        });
      });
      // If not a child (is a parent unit), keep its own position
      return best === Infinity ? (tempIdx[getUnitKey(u)] ?? 0) : best + 0.001;
    };

    gens.forEach((g) => {
      genGroups[g].sort((a, b) => parentPriority(a) - parentPriority(b));
    });

    // ── Step 5: Position units — top-down, children centered under parents ──
    const unitPos = {};
    const memberCenter = {};

    // Strategy: Process generation by generation top-down.
    // For the first generation, lay out centered.
    // For each subsequent generation, position each child-group centered under
    // its parent, then resolve any overlaps by pushing units apart.

    // Helper: find the parent unit for a given child member id
    const findParentUnit = (childMemberId) => {
      for (const f of families) {
        if (!f.childrenIds.includes(childMemberId)) continue;
        const cu = coupleUnits.find((u) => u.familyId === f.id);
        if (cu) return { unit: cu, family: f };
        const pId = f.fatherId || f.motherId;
        if (pId) {
          const su = singleUnits.find((u) => u.memberId === pId);
          if (su) return { unit: su, family: f };
        }
      }
      return null;
    };

    // Find which family a unit's members belong to as children
    const getParentFamilyId = (u) => {
      const mids = u.type === 'couple' ? [u.fatherId, u.motherId] : [u.memberId];
      for (const mid of mids) {
        for (const f of families) {
          if (f.childrenIds.includes(mid)) return f.id;
        }
      }
      return null;
    };

    gens.forEach((g, gi) => {
      const group = genGroups[g];
      const y = gi * (CARD_H + V_GAP) + 40;

      if (gi === 0) {
        // First generation: simple centered layout
        const totalW = group.reduce((sum, u) => sum + getUnitW(u), 0) + (group.length - 1) * H_GAP;
        let curX = -totalW / 2; // center around 0, will normalize later
        group.forEach((u) => {
          const w = getUnitW(u);
          unitPos[getUnitKey(u)] = { x: curX, y, w, h: CARD_H, unit: u };
          curX += w + H_GAP;
        });
      } else {
        // Group children by their parent family
        const familyGroups = {}; // familyId -> [units]
        const orphans = []; // units with no parent in previous gen

        group.forEach((u) => {
          const pfId = getParentFamilyId(u);
          if (pfId && unitPos[getUnitKey(coupleUnits.find((cu) => cu.familyId === pfId) || {})] !== undefined) {
            if (!familyGroups[pfId]) familyGroups[pfId] = [];
            familyGroups[pfId].push(u);
          } else if (pfId) {
            // Check single parent
            const f = families.find((fam) => fam.id === pfId);
            const pId = f?.fatherId || f?.motherId;
            const psu = pId && singleUnits.find((su) => su.memberId === pId);
            if (psu && unitPos[getUnitKey(psu)]) {
              if (!familyGroups[pfId]) familyGroups[pfId] = [];
              familyGroups[pfId].push(u);
            } else {
              orphans.push(u);
            }
          } else {
            orphans.push(u);
          }
        });

        // For each family group, position children centered under parent
        Object.entries(familyGroups).forEach(([fId, units]) => {
          // Find parent center x
          const cu = coupleUnits.find((u) => u.familyId === fId);
          let parentCX;
          if (cu && unitPos[getUnitKey(cu)]) {
            const pp = unitPos[getUnitKey(cu)];
            parentCX = pp.x + pp.w / 2;
          } else {
            const f = families.find((fam) => fam.id === fId);
            const pId = f?.fatherId || f?.motherId;
            const psu = pId && singleUnits.find((su) => su.memberId === pId);
            if (psu && unitPos[getUnitKey(psu)]) {
              const pp = unitPos[getUnitKey(psu)];
              parentCX = pp.x + pp.w / 2;
            }
          }

          if (parentCX === undefined) {
            orphans.push(...units);
            return;
          }

          // Compute total width of this child group
          const groupW = units.reduce((sum, u) => sum + getUnitW(u), 0) + (units.length - 1) * H_GAP;
          let curX = parentCX - groupW / 2;

          units.forEach((u) => {
            const w = getUnitW(u);
            unitPos[getUnitKey(u)] = { x: curX, y, w, h: CARD_H, unit: u };
            curX += w + H_GAP;
          });
        });

        // Place orphans after the last positioned unit
        if (orphans.length > 0) {
          const existing = group.filter((u) => unitPos[getUnitKey(u)]).map((u) => unitPos[getUnitKey(u)]);
          let startX = existing.length > 0 ? Math.max(...existing.map((p) => p.x + p.w)) + H_GAP : 0;
          orphans.forEach((u) => {
            const w = getUnitW(u);
            unitPos[getUnitKey(u)] = { x: startX, y, w, h: CARD_H, unit: u };
            startX += w + H_GAP;
          });
        }

        // Resolve overlaps: push family child-groups as blocks to prevent interleaving
        // First, identify which family each unit belongs to as a child
        const familyOrder = []; // [{familyId, unitKeys}] in sorted order
        const unitFamilyMap = {};
        group.forEach((u) => {
          const pfId = getParentFamilyId(u);
          unitFamilyMap[getUnitKey(u)] = pfId;
        });

        // Build ordered list of family groups
        const seenFamilies = new Set();
        group.forEach((u) => {
          const pfId = unitFamilyMap[getUnitKey(u)] || getUnitKey(u);
          if (!seenFamilies.has(pfId)) {
            seenFamilies.add(pfId);
            familyOrder.push(pfId);
          }
        });

        // For each family group, collect its units sorted by x
        const groupBlocks = familyOrder.map((fId) => {
          const keys = group
            .filter((u) => (unitFamilyMap[getUnitKey(u)] || getUnitKey(u)) === fId)
            .map((u) => getUnitKey(u))
            .filter((k) => unitPos[k])
            .sort((a, b) => unitPos[a].x - unitPos[b].x);
          if (keys.length === 0) return null;
          const left = unitPos[keys[0]].x;
          const right = unitPos[keys[keys.length - 1]].x + unitPos[keys[keys.length - 1]].w;
          return { keys, left, right };
        }).filter(Boolean);

        // Push blocks apart if they overlap
        for (let i = 1; i < groupBlocks.length; i++) {
          const prev = groupBlocks[i - 1];
          const curr = groupBlocks[i];
          const minX = prev.right + H_GAP;
          if (curr.left < minX) {
            const push = minX - curr.left;
            // Shift this block and all subsequent blocks
            for (let j = i; j < groupBlocks.length; j++) {
              groupBlocks[j].keys.forEach((k) => {
                unitPos[k] = { ...unitPos[k], x: unitPos[k].x + push };
              });
              groupBlocks[j].left += push;
              groupBlocks[j].right += push;
            }
          }
        }
      }
    });

    // ── Step 5b: Bottom-up pass — re-center each parent above its children's actual span ──
    // After overlap resolution may have shifted children, parents need to move too.
    const gensReversed = [...gens].reverse();
    for (let pass = 0; pass < 2; pass++) {
      gensReversed.forEach((g) => {
        families.forEach((f) => {
          // Find parent unit
          const cu = coupleUnits.find((u) => u.familyId === f.id);
          let parentKey;
          if (cu) parentKey = getUnitKey(cu);
          else {
            const pId = f.fatherId || f.motherId;
            const psu = pId && singleUnits.find((su) => su.memberId === pId);
            if (psu) parentKey = getUnitKey(psu);
          }
          if (!parentKey || !unitPos[parentKey] || f.childrenIds.length === 0) return;

          // Find child unit positions
          const childKeys = new Set();
          f.childrenIds.forEach((cId) => {
            const ccu = coupleUnits.find((u) => u.fatherId === cId || u.motherId === cId);
            if (ccu) { childKeys.add(getUnitKey(ccu)); return; }
            const ssu = singleUnits.find((u) => u.memberId === cId);
            if (ssu) childKeys.add(getUnitKey(ssu));
          });

          const childPosArr = [...childKeys].map((k) => unitPos[k]).filter(Boolean);
          if (childPosArr.length === 0) return;

          const childLeft = Math.min(...childPosArr.map((p) => p.x));
          const childRight = Math.max(...childPosArr.map((p) => p.x + p.w));
          const childCenter = (childLeft + childRight) / 2;
          const pp = unitPos[parentKey];
          const parentCenter = pp.x + pp.w / 2;
          const shift = childCenter - parentCenter;

          if (Math.abs(shift) > 1) {
            unitPos[parentKey] = { ...pp, x: pp.x + shift };
          }
        });
      });

      // After moving parents, resolve overlaps in each generation again
      gens.forEach((g) => {
        const group = genGroups[g];
        const items2 = group.map((u) => getUnitKey(u))
          .filter((k) => unitPos[k])
          .sort((a, b) => unitPos[a].x - unitPos[b].x);

        for (let i = 1; i < items2.length; i++) {
          const prev = unitPos[items2[i - 1]];
          const curr = unitPos[items2[i]];
          const minX2 = prev.x + prev.w + H_GAP;
          if (curr.x < minX2) {
            const push2 = minX2 - curr.x;
            for (let j = i; j < items2.length; j++) {
              unitPos[items2[j]] = { ...unitPos[items2[j]], x: unitPos[items2[j]].x + push2 };
            }
          }
        }
      });
    }

    // Normalize: shift everything so the leftmost unit starts at x=50
    const allKeys = Object.keys(unitPos);
    if (allKeys.length > 0) {
      const minX = Math.min(...allKeys.map((k) => unitPos[k].x));
      const shiftX = 50 - minX;
      allKeys.forEach((k) => { unitPos[k] = { ...unitPos[k], x: unitPos[k].x + shiftX }; });
    }

    // Compute member centers
    Object.values(unitPos).forEach(({ x, y, w, h, unit: u }) => {
      if (u.type === 'couple') {
        memberCenter[u.fatherId] = { x: x + w * 0.25, y: y + CARD_H / 2 };
        memberCenter[u.motherId] = { x: x + w * 0.75, y: y + CARD_H / 2 };
      } else {
        memberCenter[u.memberId] = { x: x + w / 2, y: y + CARD_H / 2 };
      }
    });

    // Compute actual width from final positions
    const allPos = Object.values(unitPos);
    const layoutWidth = allPos.length > 0
      ? Math.max(...allPos.map((p) => p.x + p.w)) + 50
      : 500;

    // ── Step 6: Build links ──
    // For each family, draw a line from the couple card (or single parent card)
    // bottom center → down to a horizontal bar → down to each child's card top center.
    // Use per-family offset for the horizontal bar to prevent overlap.
    const links = [];
    let familyLinkIndex = 0;

    families.forEach((f) => {
      // Find the parent unit position
      let parentBottomCenter;
      const coupleUnit = coupleUnits.find((u) => u.familyId === f.id);
      if (coupleUnit) {
        const key = getUnitKey(coupleUnit);
        const pos = unitPos[key];
        parentBottomCenter = { x: pos.x + pos.w / 2, y: pos.y + CARD_H };
      } else {
        // Single parent
        const pId = f.fatherId || f.motherId;
        if (pId && memberCenter[pId]) {
          parentBottomCenter = { x: memberCenter[pId].x, y: memberCenter[pId].y + CARD_H / 2 };
        }
      }

      if (!parentBottomCenter || f.childrenIds.length === 0) return;

      // Child top centers
      const childTops = f.childrenIds.map((cId) => {
        // Find the unit this child belongs to
        const childCoupleUnit = coupleUnits.find((u) => u.fatherId === cId || u.motherId === cId);
        if (childCoupleUnit) {
          const key = getUnitKey(childCoupleUnit);
          const pos = unitPos[key];
          // Connect to the side of the couple card where this child is
          const cx = childCoupleUnit.fatherId === cId ? pos.x + pos.w * 0.25 : pos.x + pos.w * 0.75;
          return { x: cx, y: pos.y };
        }
        const singleUnit = singleUnits.find((u) => u.memberId === cId);
        if (singleUnit) {
          const key = getUnitKey(singleUnit);
          const pos = unitPos[key];
          return { x: pos.x + pos.w / 2, y: pos.y };
        }
        return null;
      }).filter(Boolean);

      if (childTops.length === 0) return;

      // Horizontal bar Y — offset each family slightly to avoid overlap
      const baseBarY = parentBottomCenter.y + (V_GAP - CARD_H) * 0.45;
      const barYOffset = familyLinkIndex * 6;
      const barY = baseBarY + barYOffset;
      familyLinkIndex++;

      // Vertical from parent to bar
      links.push({ x1: parentBottomCenter.x, y1: parentBottomCenter.y, x2: parentBottomCenter.x, y2: barY });

      if (childTops.length === 1) {
        // Single child: just draw an L-shape
        const ct = childTops[0];
        links.push({ x1: parentBottomCenter.x, y1: barY, x2: ct.x, y2: barY });
        links.push({ x1: ct.x, y1: barY, x2: ct.x, y2: ct.y });
      } else {
        // Horizontal bar spanning all children + parent
        const allX = [parentBottomCenter.x, ...childTops.map((c) => c.x)];
        const barLeft = Math.min(...allX);
        const barRight = Math.max(...allX);
        links.push({ x1: barLeft, y1: barY, x2: barRight, y2: barY });
        // Drop lines to each child
        childTops.forEach((ct) => {
          links.push({ x1: ct.x, y1: barY, x2: ct.x, y2: ct.y });
        });
      }
    });

    // Build output cards for rendering
    const coupleCards = [];
    const singleCards = [];

    Object.values(unitPos).forEach(({ x, y, w, h, unit }) => {
      if (unit.type === 'couple') {
        const father = members.find((m) => m.id === unit.fatherId);
        const mother = members.find((m) => m.id === unit.motherId);
        coupleCards.push({ x, y, w, h, father, mother, gen: unit.gen, familyId: unit.familyId });
      } else {
        const member = members.find((m) => m.id === unit.memberId);
        if (member) singleCards.push({ x, y, w, h, member, gen: unit.gen });
      }
    });

    return {
      coupleCards,
      singleCards,
      links,
      width: Math.max(layoutWidth, 500),
      height: gens.length * (CARD_H + V_GAP) + 100,
    };
  }, [members, families]);

  // Center on load
  useEffect(() => {
    if (containerRef.current && (layout.coupleCards.length > 0 || layout.singleCards.length > 0)) {
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      const s = Math.min(cw / layout.width, ch / layout.height, 1) * 0.85;
      setZoom(s);
      setPan({
        x: (cw - layout.width * s) / 2,
        y: (ch - layout.height * s) / 2 + 20,
      });
    }
  }, [layout]);

  // Pan handlers
  const handleMouseDown = (e) => {
    // Allow drag on the container div or SVG background
    const tag = e.target.tagName?.toLowerCase();
    if (e.target === containerRef.current || e.target === svgRef.current || tag === "svg" || (tag === "rect" && e.target.getAttribute("data-bg"))) {
      setDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };
  const handleMouseMove = (e) => {
    if (dragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };
  const handleMouseUp = () => setDragging(false);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.min(Math.max(z * delta, 0.2), 3));
  }, []);

  // Attach wheel listener with { passive: false } to allow preventDefault
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // Touch handlers
  const lastTouchRef = useRef(null);
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      lastTouchRef.current = { x: t.clientX, y: t.clientY };
      setDragging(true);
      setDragStart({ x: t.clientX - pan.x, y: t.clientY - pan.y });
    }
  };
  const handleTouchMove = (e) => {
    if (dragging && e.touches.length === 1) {
      const t = e.touches[0];
      setPan({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y });
    }
  };
  const handleTouchEnd = () => setDragging(false);

  // Node click
  const handleNodeClick = (node, e) => {
    e.stopPropagation();
    setSelectedNode(node.id === selectedNode ? null : node.id);
    setContextMenu(null);
  };

  const handleNodeContextMenu = (node, e) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ id: node.id, x: e.clientX, y: e.clientY });
  };

  // Quick add family modal
  const [quickAddFamily, setQuickAddFamily] = useState(null);
  const [qaChildRows, setQaChildRows] = useState([{ name: "", gender: "male", birthYear: "", key: "r0" }]);
  const [qaSpouseName, setQaSpouseName] = useState("");
  const [qaSpouseGender, setQaSpouseGender] = useState("female");
  const [qaSpouseYear, setQaSpouseYear] = useState("");
  const [qaAction, setQaAction] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Check if a member has grandchildren (children who themselves have children)
  const memberHasGrandchildren = (nodeId) => {
    const memberFamilies = families.filter((f) => f.fatherId === nodeId || f.motherId === nodeId);
    const childIds = memberFamilies.flatMap((f) => f.childrenIds);
    return childIds.some((cId) =>
      families.some((f) => (f.fatherId === cId || f.motherId === cId) && f.childrenIds.length > 0)
    );
  };

  const handleQuickAction = (action, nodeId) => {
    setContextMenu(null);
    const member = members.find((m) => m.id === nodeId);
    if (!member) return;

    if (action === "delete") {
      setDeleteConfirmId(nodeId);
      setSelectedNode(null);
      return;
    }

    if (action === "edit") {
      setEditingNode({ ...member, birthYear: member.birthYear || "" });
      return;
    }

    if (action === "addChild") {
      setQaAction("addChild");
      setQuickAddFamily(nodeId);
      setQaChildRows([{ name: "", gender: "male", birthYear: "", key: "r0" }]);
      return;
    }

    if (action === "addSpouse") {
      setQaAction("addSpouse");
      setQuickAddFamily(nodeId);
      setQaSpouseName("");
      setQaSpouseGender(member.gender === "male" ? "female" : "male");
      setQaSpouseYear("");
      return;
    }
  };

  const confirmQuickAddChildren = () => {
    const parent = members.find((m) => m.id === quickAddFamily);
    if (!parent) return;
    const validRows = qaChildRows.filter((r) => r.name.trim());
    if (validRows.length === 0) { showToast("请至少填写一个子女", "error"); return; }

    const existingFamily = families.find(
      (f) => f.fatherId === parent.id || f.motherId === parent.id
    );

    let count = 0;
    const newChildIds = [];
    validRows.forEach((r) => {
      const child = addMember({ name: r.name.trim(), gender: r.gender, birthYear: r.birthYear ? parseInt(r.birthYear) : null });
      if (existingFamily && existingFamily.childrenIds.includes(child.id)) return;
      newChildIds.push(child.id);
      count++;
    });

    if (existingFamily) {
      if (newChildIds.length > 0) {
        updateFamily(existingFamily.id, { childrenIds: [...existingFamily.childrenIds, ...newChildIds] });
      }
    } else if (newChildIds.length > 0) {
      addFamily({
        fatherId: parent.gender === "male" ? parent.id : null,
        motherId: parent.gender === "female" ? parent.id : null,
        childrenIds: newChildIds,
      });
    }

    if (count > 0) showToast(`已添加 ${count} 个子女`);
    else showToast("子女已存在，未添加新成员", "error");
    setQuickAddFamily(null);
    setQaAction(null);
  };

  const confirmQuickAddSpouse = () => {
    if (!qaSpouseName.trim()) return;
    const parent = members.find((m) => m.id === quickAddFamily);
    if (!parent) return;
    const spouse = addMember({ name: qaSpouseName.trim(), gender: qaSpouseGender, birthYear: qaSpouseYear ? parseInt(qaSpouseYear) : null });

    const existingFamily = families.find(
      (f) => (f.fatherId === parent.id && !f.motherId) || (f.motherId === parent.id && !f.fatherId)
    );
    if (existingFamily) {
      if (parent.gender === "male") {
        updateFamily(existingFamily.id, { motherId: spouse.id });
      } else {
        updateFamily(existingFamily.id, { fatherId: spouse.id });
      }
    } else {
      addFamily({
        fatherId: parent.gender === "male" ? parent.id : spouse.id,
        motherId: parent.gender === "female" ? parent.id : spouse.id,
        childrenIds: [],
      });
    }
    showToast(`已添加配偶: ${qaSpouseName}`);
    setQuickAddFamily(null);
    setQaAction(null);
  };

  if (members.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "#c9a96e88" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🌳</div>
        <div style={{ fontSize: "16px" }}>请先在「录入信息」中添加家庭成员</div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Toolbar */}
      <div style={{
        display: "flex", justifyContent: "center", gap: "8px",
        padding: "0 20px 12px",
        flexWrap: "wrap",
      }}>
        <button style={{ ...btnSecondary, padding: "6px 14px", fontSize: "12px" }} onClick={() => setZoom((z) => Math.min(z * 1.2, 3))}>
          ＋ 放大
        </button>
        <button style={{ ...btnSecondary, padding: "6px 14px", fontSize: "12px" }} onClick={() => setZoom((z) => Math.max(z * 0.8, 0.2))}>
          − 缩小
        </button>
        <button style={{ ...btnSecondary, padding: "6px 14px", fontSize: "12px" }} onClick={() => {
          if (containerRef.current) {
            const cw = containerRef.current.clientWidth;
            const ch = containerRef.current.clientHeight;
            const s = Math.min(cw / layout.width, ch / layout.height, 1) * 0.85;
            setZoom(s);
            setPan({ x: (cw - layout.width * s) / 2, y: (ch - layout.height * s) / 2 + 20 });
          }
        }}>
          ⟲ 重置视图
        </button>
        <button style={{ ...btnSecondary, padding: "6px 14px", fontSize: "12px" }} onClick={exportData}>
          📤 导出JSON
        </button>
        <span style={{ fontSize: "12px", color: "#888", alignSelf: "center", marginLeft: "8px" }}>
          💡 点击成员可编辑 | 拖拽平移 | 滚轮缩放
        </span>
      </div>

      {/* SVG Canvas */}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "calc(100vh - 220px)",
          minHeight: "400px",
          overflow: "hidden",
          cursor: dragging ? "grabbing" : "grab",
          position: "relative",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => { setSelectedNode(null); setContextMenu(null); }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          <defs>
            <linearGradient id="maleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a2a4a" />
              <stop offset="100%" stopColor="#0f1a30" />
            </linearGradient>
            <linearGradient id="femaleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3a1a2a" />
              <stop offset="100%" stopColor="#250f1a" />
            </linearGradient>
            <linearGradient id="coupleGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8ab4f8" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#c9a96e" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#f0a0b8" stopOpacity="0.4" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
            {/* Parent-child links */}
            {layout.links.map((l, i) => (
              <line key={`link-${i}`}
                x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                stroke="#c9a96e" strokeWidth="1.5" strokeOpacity="0.35"
              />
            ))}

            {/* Couple cards */}
            {layout.coupleCards.map((card) => {
              const isSelF = selectedNode === card.father?.id;
              const isSelM = selectedNode === card.mother?.id;
              const isSelected = isSelF || isSelM;
              return (
                <g key={`couple-${card.familyId}`}>
                  {/* Selection glow */}
                  {isSelected && (
                    <rect x={card.x - 3} y={card.y - 3} width={card.w + 6} height={card.h + 6}
                      rx="12" fill="none" stroke="#c9a96e" strokeWidth="2" opacity="0.5" filter="url(#glow)" />
                  )}
                  {/* Card background */}
                  <rect x={card.x} y={card.y} width={card.w} height={card.h}
                    rx="10"
                    fill="rgba(15,15,25,0.9)"
                    stroke={isSelected ? "#c9a96e" : "rgba(201,169,110,0.2)"}
                    strokeWidth={isSelected ? "1.5" : "1"}
                  />
                  {/* Divider line */}
                  <line x1={card.x + card.w / 2} y1={card.y + 8} x2={card.x + card.w / 2} y2={card.y + card.h - 8}
                    stroke="rgba(201,169,110,0.15)" strokeWidth="1" />
                  {/* Heart */}
                  <text x={card.x + card.w / 2} y={card.y - 6}
                    textAnchor="middle" fontSize="13" fill="#c9a96e" opacity="0.7">♥</text>
                  {/* Gen badge */}
                  <text x={card.x + card.w - 8} y={card.y + 14} fontSize="9"
                    fill="#c9a96e" textAnchor="end" opacity="0.5">{card.gen + 1}代</text>

                  {/* Father (left half) */}
                  {card.father && (
                    <g onClick={(e) => { e.stopPropagation(); handleNodeClick(card.father, e); }}
                       onContextMenu={(e) => handleNodeContextMenu(card.father, e)}
                       style={{ cursor: "pointer" }}>
                      <rect x={card.x} y={card.y} width={card.w / 2} height={card.h}
                        rx="10" fill={isSelF ? "rgba(100,149,237,0.15)" : "rgba(100,149,237,0.05)"} />
                      <text x={card.x + 14} y={card.y + 28} fontSize="14" fill="#8ab4f8">♂</text>
                      <text x={card.x + 30} y={card.y + 28} fontSize="13"
                        fill="#e8e6e3" fontFamily="'Noto Serif SC', serif" fontWeight="600">
                        {card.father.name.length > 4 ? card.father.name.slice(0, 4) + ".." : card.father.name}
                      </text>
                      {card.father.birthYear && (
                        <text x={card.x + card.w * 0.25} y={card.y + 50} fontSize="10"
                          fill="#888" textAnchor="middle">{card.father.birthYear}</text>
                      )}
                    </g>
                  )}

                  {/* Mother (right half) */}
                  {card.mother && (
                    <g onClick={(e) => { e.stopPropagation(); handleNodeClick(card.mother, e); }}
                       onContextMenu={(e) => handleNodeContextMenu(card.mother, e)}
                       style={{ cursor: "pointer" }}>
                      <rect x={card.x + card.w / 2} y={card.y} width={card.w / 2} height={card.h}
                        rx="10" fill={isSelM ? "rgba(219,112,147,0.15)" : "rgba(219,112,147,0.05)"} />
                      <text x={card.x + card.w / 2 + 14} y={card.y + 28} fontSize="14" fill="#f0a0b8">♀</text>
                      <text x={card.x + card.w / 2 + 30} y={card.y + 28} fontSize="13"
                        fill="#e8e6e3" fontFamily="'Noto Serif SC', serif" fontWeight="600">
                        {card.mother.name.length > 4 ? card.mother.name.slice(0, 4) + ".." : card.mother.name}
                      </text>
                      {card.mother.birthYear && (
                        <text x={card.x + card.w * 0.75} y={card.y + 50} fontSize="10"
                          fill="#888" textAnchor="middle">{card.mother.birthYear}</text>
                      )}
                    </g>
                  )}
                </g>
              );
            })}

            {/* Single cards */}
            {layout.singleCards.map((card) => {
              const m = card.member;
              const isSelected = selectedNode === m.id;
              const isMale = m.gender === "male";
              return (
                <g key={`single-${m.id}`}
                  onClick={(e) => { e.stopPropagation(); handleNodeClick(m, e); }}
                  onContextMenu={(e) => handleNodeContextMenu(m, e)}
                  style={{ cursor: "pointer" }}
                >
                  {isSelected && (
                    <rect x={card.x - 3} y={card.y - 3} width={card.w + 6} height={card.h + 6}
                      rx="12" fill="none"
                      stroke={isMale ? "#8ab4f8" : "#f0a0b8"}
                      strokeWidth="2" opacity="0.5" filter="url(#glow)" />
                  )}
                  <rect x={card.x} y={card.y} width={card.w} height={card.h}
                    rx="10"
                    fill={isMale ? "url(#maleGrad)" : "url(#femaleGrad)"}
                    stroke={isSelected ? (isMale ? "#8ab4f8" : "#f0a0b8") : "rgba(201,169,110,0.2)"}
                    strokeWidth={isSelected ? "1.5" : "1"}
                  />
                  <text x={card.x + 14} y={card.y + 30} fontSize="15"
                    fill={isMale ? "#8ab4f8" : "#f0a0b8"}>
                    {isMale ? "♂" : "♀"}
                  </text>
                  <text x={card.x + 32} y={card.y + 30} fontSize="13"
                    fill="#e8e6e3" fontFamily="'Noto Serif SC', serif" fontWeight="600">
                    {m.name.length > 4 ? m.name.slice(0, 4) + ".." : m.name}
                  </text>
                  {m.birthYear && (
                    <text x={card.x + card.w / 2} y={card.y + 52} fontSize="10"
                      fill="#888" textAnchor="middle">{m.birthYear}</text>
                  )}
                  <text x={card.x + card.w - 8} y={card.y + 14} fontSize="9"
                    fill="#c9a96e" textAnchor="end" opacity="0.5">{card.gen + 1}代</text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Selected node action bar */}
      {selectedNode && !contextMenu && (() => {
        const selMember = members.find((m) => m.id === selectedNode);
        const hasSpouse = families.some((f) =>
          (f.fatherId === selectedNode && f.motherId) || (f.motherId === selectedNode && f.fatherId)
        );
        const canDelete = !memberHasGrandchildren(selectedNode);
        return (
          <div style={{
            position: "absolute",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "8px",
            background: "rgba(10,10,15,0.95)",
            padding: "12px 20px",
            borderRadius: "12px",
            border: "1px solid rgba(201,169,110,0.2)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            zIndex: 10,
            flexWrap: "wrap",
            justifyContent: "center",
          }}>
            <span style={{ fontSize: "13px", color: "#c9a96e", alignSelf: "center", marginRight: "8px", fontWeight: 600 }}>
              {selMember?.name}
            </span>
            <button style={{ ...btnSecondary, padding: "6px 14px", fontSize: "12px" }} onClick={() => handleQuickAction("edit", selectedNode)}>
              ✏️ 编辑
            </button>
            {!hasSpouse && (
              <button style={{ ...btnSecondary, padding: "6px 14px", fontSize: "12px" }} onClick={() => handleQuickAction("addSpouse", selectedNode)}>
                💍 添加配偶
              </button>
            )}
            <button style={{ ...btnSecondary, padding: "6px 14px", fontSize: "12px" }} onClick={() => handleQuickAction("addChild", selectedNode)}>
              👶 添加子女
            </button>
            {canDelete && (
              <button style={{ ...btnDanger, padding: "6px 14px", fontSize: "12px" }} onClick={() => handleQuickAction("delete", selectedNode)}>
                🗑 删除
              </button>
            )}
          </div>
        );
      })()}

      {/* Context menu (right click) */}
      {contextMenu && (() => {
        const hasSpouse = families.some((f) =>
          (f.fatherId === contextMenu.id && f.motherId) || (f.motherId === contextMenu.id && f.fatherId)
        );
        const canDelete = !memberHasGrandchildren(contextMenu.id);
        const menuItems = [
          { label: "✏️ 编辑", action: "edit" },
          ...(!hasSpouse ? [{ label: "💍 添加配偶", action: "addSpouse" }] : []),
          { label: "👶 添加子女", action: "addChild" },
          ...(canDelete ? [{ label: "🗑 删除", action: "delete" }] : []),
        ];
        return (
          <div style={{
            position: "fixed",
            left: contextMenu.x,
            top: contextMenu.y,
            background: "rgba(15,15,20,0.98)",
            border: "1px solid rgba(201,169,110,0.2)",
            borderRadius: "8px",
            padding: "6px",
            zIndex: 100,
            minWidth: "140px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          }}
            onClick={(e) => e.stopPropagation()}
          >
            {menuItems.map((item) => (
              <div key={item.action}
                style={{
                  padding: "8px 14px",
                  fontSize: "13px",
                  cursor: "pointer",
                  borderRadius: "4px",
                  color: item.action === "delete" ? "#e07070" : "#e8e6e3",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => e.target.style.background = "rgba(201,169,110,0.1)"}
                onMouseLeave={(e) => e.target.style.background = "transparent"}
                onClick={() => handleQuickAction(item.action, contextMenu.id)}
              >
                {item.label}
              </div>
            ))}
          </div>
        );
      })()}

      {/* Edit modal */}
      {editingNode && (
        <Modal onClose={() => setEditingNode(null)}>
          <h3 style={{ margin: "0 0 16px", color: "#c9a96e", fontSize: "18px" }}>编辑成员</h3>
          <MemberForm
            draft={{ name: editingNode.name, gender: editingNode.gender, birthYear: editingNode.birthYear || "" }}
            setDraft={(d) => setEditingNode((p) => ({ ...p, ...(typeof d === "function" ? d(p) : d) }))}
            onSave={() => {
              updateMember(editingNode.id, {
                name: editingNode.name,
                gender: editingNode.gender,
                birthYear: editingNode.birthYear ? parseInt(editingNode.birthYear) : null,
              });
              showToast("已更新");
              setEditingNode(null);
            }}
            onCancel={() => setEditingNode(null)}
            saveLabel="保存"
          />
        </Modal>
      )}

      {/* Quick add child modal */}
      {qaAction === "addChild" && quickAddFamily && (() => {
        const parentMember = members.find((m) => m.id === quickAddFamily);
        const parentFamily = families.find((f) => f.fatherId === quickAddFamily || f.motherId === quickAddFamily);
        const existingChildren = parentFamily
          ? parentFamily.childrenIds.map((id) => members.find((m) => m.id === id)).filter(Boolean)
          : [];

        const updateRow = (idx, field, val) => {
          setQaChildRows((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
        };
        const addRow = () => {
          setQaChildRows((prev) => [...prev, { name: "", gender: "male", birthYear: "", key: "r" + Date.now() }]);
        };
        const removeRow = (idx) => {
          setQaChildRows((prev) => prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx));
        };

        return (
          <Modal onClose={() => { setQuickAddFamily(null); setQaAction(null); }}>
            <h3 style={{ margin: "0 0 12px", color: "#c9a96e", fontSize: "18px" }}>
              为 {parentMember?.name} 添加子女
            </h3>
            {existingChildren.length > 0 && (
              <div style={{ marginBottom: "14px" }}>
                <div style={{ fontSize: "12px", color: "#888", marginBottom: "8px" }}>已有子女：</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {existingChildren.map((c) => (
                    <span key={c.id} style={{
                      padding: "3px 10px", fontSize: "12px", borderRadius: "12px",
                      background: c.gender === "male" ? "rgba(100,149,237,0.12)" : "rgba(219,112,147,0.12)",
                      border: `1px solid ${c.gender === "male" ? "rgba(100,149,237,0.25)" : "rgba(219,112,147,0.25)"}`,
                      color: c.gender === "male" ? "#8ab4f8" : "#f0a0b8",
                    }}>
                      {c.gender === "male" ? "♂" : "♀"} {c.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Child rows */}
            {qaChildRows.map((row, idx) => (
              <div key={row.key} style={{
                display: "flex", gap: "6px",
                marginBottom: "8px", alignItems: "flex-start",
              }}>
                <input
                  style={{ ...inputStyle, fontSize: "13px", padding: "8px 10px", flex: "1 1 80px", minWidth: 0 }}
                  value={row.name}
                  onChange={(e) => updateRow(idx, "name", e.target.value)}
                  placeholder="姓名"
                />
                <div style={{ display: "flex", flexShrink: 0 }}>
                  {[{ v: "male", l: "♂男", c: "#8ab4f8", bg: "rgba(100,149,237," },
                    { v: "female", l: "♀女", c: "#f0a0b8", bg: "rgba(219,112,147," }].map((o) => {
                    const sel = row.gender === o.v;
                    return (
                      <button key={o.v} type="button"
                        onClick={() => updateRow(idx, "gender", o.v)}
                        style={{
                          padding: "7px 8px", fontSize: "13px", cursor: "pointer",
                          fontFamily: "'Noto Serif SC', serif", whiteSpace: "nowrap",
                          background: sel ? o.bg + "0.25)" : "rgba(0,0,0,0.2)",
                          color: sel ? o.c : "#555",
                          border: `1px solid ${sel ? o.bg + "0.4)" : "rgba(201,169,110,0.1)"}`,
                          borderRadius: o.v === "male" ? "5px 0 0 5px" : "0 5px 5px 0",
                          fontWeight: sel ? 700 : 400,
                        }}
                      >{o.l}</button>
                    );
                  })}
                </div>
                <div style={{ flexShrink: 0, width: "120px" }}>
                  <YearPicker
                    value={row.birthYear}
                    onChange={(v) => updateRow(idx, "birthYear", v)}
                    compact
                  />
                </div>
                {qaChildRows.length > 1 ? (
                  <button type="button" onClick={() => removeRow(idx)}
                    style={{
                      width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
                      background: "rgba(180,60,60,0.15)", border: "1px solid rgba(180,60,60,0.3)",
                      color: "#e07070", cursor: "pointer", fontSize: "14px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>✕</button>
                ) : <div style={{ width: "28px", flexShrink: 0 }} />}
              </div>
            ))}

            {/* Add row button — compact */}
            <div style={{ marginBottom: "14px" }}>
              <button type="button" onClick={addRow}
                style={{
                  padding: "5px 14px",
                  background: "rgba(201,169,110,0.06)", border: "1px dashed rgba(201,169,110,0.25)",
                  borderRadius: "6px", color: "#c9a96e", fontSize: "12px", cursor: "pointer",
                  fontFamily: "'Noto Serif SC', serif",
                }}>
                ＋ 加一行
              </button>
            </div>

            {/* Submit / Cancel */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button style={{
                ...btnPrimary, flex: 1,
              }} onClick={confirmQuickAddChildren}>
                ✓ 提交全部子女
              </button>
              <button style={{ ...btnSecondary }} onClick={() => { setQuickAddFamily(null); setQaAction(null); }}>
                取消
              </button>
            </div>
          </Modal>
        );
      })()}

      {/* Quick add spouse modal */}
      {qaAction === "addSpouse" && quickAddFamily && (
        <Modal onClose={() => { setQuickAddFamily(null); setQaAction(null); }}>
          <h3 style={{ margin: "0 0 16px", color: "#c9a96e", fontSize: "18px" }}>
            为 {members.find((m) => m.id === quickAddFamily)?.name} 添加配偶
          </h3>
          <MemberForm
            draft={{ name: qaSpouseName, gender: qaSpouseGender, birthYear: qaSpouseYear }}
            setDraft={(d) => {
              const val = typeof d === "function" ? d({ name: qaSpouseName, gender: qaSpouseGender, birthYear: qaSpouseYear }) : d;
              if (val.name !== undefined) setQaSpouseName(val.name);
              // Gender is locked, ignore gender changes
              if (val.birthYear !== undefined) setQaSpouseYear(val.birthYear);
            }}
            genderLocked={true}
            onSave={confirmQuickAddSpouse}
            onCancel={() => { setQuickAddFamily(null); setQaAction(null); }}
            saveLabel="添加配偶"
          />
        </Modal>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirmId && (() => {
        const delMember = members.find((m) => m.id === deleteConfirmId);
        if (!delMember) return null;
        return (
          <Modal onClose={() => setDeleteConfirmId(null)}>
            <h3 style={{ margin: "0 0 12px", color: "#e07070", fontSize: "18px" }}>确认删除</h3>
            <p style={{ fontSize: "14px", color: "#e8e6e3", margin: "0 0 20px", lineHeight: 1.6 }}>
              确定要删除成员 <strong style={{ color: "#c9a96e" }}>{delMember.name}</strong> 吗？
              <br/>
              <span style={{ fontSize: "12px", color: "#888" }}>该操作将同时移除此成员的所有家庭关联</span>
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button style={{ ...btnDanger, padding: "10px 24px" }} onClick={() => {
                deleteMember(deleteConfirmId);
                showToast(`已删除: ${delMember.name}`);
                setDeleteConfirmId(null);
                setSelectedNode(null);
              }}>
                确认删除
              </button>
              <button style={{ ...btnSecondary, padding: "10px 24px" }} onClick={() => setDeleteConfirmId(null)}>
                取消
              </button>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}

// ─── Modal ───
function Modal({ children, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 200,
      padding: "20px",
    }}
      onClick={onClose}
    >
      <div style={{
        background: "#121218",
        border: "1px solid rgba(201,169,110,0.2)",
        borderRadius: "12px",
        padding: "24px",
        maxWidth: "420px",
        width: "100%",
        boxShadow: "0 16px 64px rgba(0,0,0,0.6)",
      }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
