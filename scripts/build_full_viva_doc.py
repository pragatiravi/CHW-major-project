# scripts/build_full_viva_doc.py
"""
Master Builder for:
COMMUNITY HEALTH WORKERS TOOLKIT — COMPLETE TECHNICAL DOCUMENTATION, PRESENTATION GUIDE & VIVA PREPARATION.docx
"""

import os
import re
import shutil
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

import doc_content_overview
import doc_content_ai_multilingual
import doc_content_security_qa
import doc_content_viva_qa

def clean_xml_string(s):
    if not isinstance(s, str):
        s = str(s)
    # Remove control characters that are invalid in XML 1.0 (except \t, \n, \r)
    return re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x84\x86-\x9f]', ' ', s)

class DocumentBuilder:
    def __init__(self):
        self.doc = docx.Document()
        
        # Color Palette
        self.COLOR_NAVY = RGBColor(26, 54, 93)      # #1A365D - Deep Navy Primary
        self.COLOR_TEAL = RGBColor(13, 148, 136)    # #0D9488 - Medical Teal Secondary
        self.COLOR_SLATE = RGBColor(71, 85, 105)    # #475569 - Slate Body Accent
        self.COLOR_DARK = RGBColor(15, 23, 42)      # #0F172A - Dark Text
        self.HEX_NAVY = "1A365D"
        self.HEX_TEAL = "0D9488"
        self.HEX_LIGHT_BG = "F8FAFC"
        self.HEX_CALLOUT_BG = "F0FDFA"
        self.HEX_BORDER = "CBD5E1"
        self.HEX_ALT_ROW = "F1F5F9"

        # Margins: 1 inch on all sides
        for section in self.doc.sections:
            section.top_margin = Inches(1)
            section.bottom_margin = Inches(1)
            section.left_margin = Inches(1)
            section.right_margin = Inches(1)

        # Set Normal Style font
        style = self.doc.styles['Normal']
        font = style.font
        font.name = 'Calibri'
        font.size = Pt(11)
        font.color.rgb = self.COLOR_DARK

    def set_cell_background(self, cell, fill_hex):
        tcPr = cell._tc.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
        tcPr.append(shd)

    def set_cell_margins(self, cell, top=120, bottom=120, left=180, right=180):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
        tcPr.append(tcMar)

    def set_cell_border(self, cell, **kwargs):
        """
        kwargs: top, bottom, left, right
        values: {"sz": 12, "val": "single", "color": "1A365D"}
        """
        tcPr = cell._tc.get_or_add_tcPr()
        tcBorders = parse_xml(f'<w:tcBorders {nsdecls("w")}/>')
        for edge in ('top', 'left', 'bottom', 'right'):
            edge_data = kwargs.get(edge)
            if edge_data:
                tag = f'<w:{edge} {nsdecls("w")} w:val="{edge_data.get("val", "single")}" w:sz="{edge_data.get("sz", 4)}" w:space="0" w:color="{edge_data.get("color", "auto")}"/>'
                tcBorders.append(parse_xml(tag))
            else:
                tag = f'<w:{edge} {nsdecls("w")} w:val="none"/>'
                tcBorders.append(parse_xml(tag))
        tcPr.append(tcBorders)

    def add_cover_page(self):
        # Spacing
        p_space = self.doc.add_paragraph()
        p_space.paragraph_format.space_before = Pt(40)
        
        # Institution
        p_inst = self.doc.add_paragraph()
        p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_inst = p_inst.add_run("ANGADI INSTITUTE OF TECHNOLOGY AND MANAGEMENT, BELAGAVI\nDEPARTMENT OF COMPUTER SCIENCE & ENGINEERING")
        r_inst.font.name = 'Calibri'
        r_inst.font.size = Pt(13)
        r_inst.font.bold = True
        r_inst.font.color.rgb = self.COLOR_NAVY

        p_div = self.doc.add_paragraph()
        p_div.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_div.paragraph_format.space_after = Pt(30)
        r_div = p_div.add_run("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        r_div.font.color.rgb = self.COLOR_TEAL

        # Project Title
        p_title = self.doc.add_paragraph()
        p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_title.paragraph_format.space_after = Pt(12)
        r_title = p_title.add_run("COMMUNITY HEALTH WORKERS TOOLKIT\n(CHW TOOLKIT)")
        r_title.font.name = 'Calibri'
        r_title.font.size = Pt(26)
        r_title.font.bold = True
        r_title.font.color.rgb = self.COLOR_NAVY

        # Subtitle
        p_sub = self.doc.add_paragraph()
        p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_sub.paragraph_format.space_after = Pt(30)
        r_sub = p_sub.add_run("COMPLETE TECHNICAL DOCUMENTATION, ARCHITECTURAL BLUEPRINT, PRESENTATION GUIDE & VIVA VOCE MASTER PREPARATION DOSSIER")
        r_sub.font.name = 'Calibri'
        r_sub.font.size = Pt(13)
        r_sub.font.bold = True
        r_sub.font.color.rgb = self.COLOR_TEAL

        # Metadata Box (Table)
        table = self.doc.add_table(rows=6, cols=2)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        meta_data = [
            ("Project Domain:", "Healthcare Technology / AI-Assisted Digital Health / Community Health Support"),
            ("Target Users:", "Community Health Workers (ASHAs / ANMs), PHC Medical Officers, Supervisors"),
            ("Primary Focus:", "Non-Communicable Diseases (Type 2 Diabetes & Hypertension) + Maternal Safety"),
            ("Production URL:", "https://chw-major-project.vercel.app/"),
            ("Academic Year:", "Final Year Engineering Project (B.E. Computer Science & Engineering)"),
            ("Documentation Scope:", "Architecture, Security, CDSS Algorithms, AI Copilot, 101 Tests, 120+ Viva Q&As")
        ]
        for row_idx, (k, v) in enumerate(meta_data):
            cell_k = table.cell(row_idx, 0)
            cell_v = table.cell(row_idx, 1)
            cell_k.width = Inches(2.2)
            cell_v.width = Inches(4.3)
            self.set_cell_background(cell_k, self.HEX_LIGHT_BG)
            self.set_cell_background(cell_v, "FFFFFF")
            self.set_cell_margins(cell_k, top=100, bottom=100, left=150, right=150)
            self.set_cell_margins(cell_v, top=100, bottom=100, left=150, right=150)
            
            p_k = cell_k.paragraphs[0]
            p_k.paragraph_format.space_after = Pt(0)
            r_k = p_k.add_run(k)
            r_k.font.bold = True
            r_k.font.color.rgb = self.COLOR_NAVY
            
            p_v = cell_v.paragraphs[0]
            p_v.paragraph_format.space_after = Pt(0)
            r_v = p_v.add_run(v)
            r_v.font.color.rgb = self.COLOR_DARK

        p_bottom = self.doc.add_paragraph()
        p_bottom.paragraph_format.space_before = Pt(50)
        p_bottom.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_bottom = p_bottom.add_run("CONFIDENTIAL & ACADEMIC DEFENSE USE ONLY — PREPARED FOR FINAL VIVA EXAMINATION")
        r_bottom.font.size = Pt(9)
        r_bottom.font.bold = True
        r_bottom.font.color.rgb = self.COLOR_SLATE

        self.doc.add_page_break()

    def h1(self, text):
        p = self.doc.add_paragraph()
        p.paragraph_format.space_before = Pt(22)
        p.paragraph_format.space_after = Pt(8)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(clean_xml_string(text))
        run.font.name = 'Calibri'
        run.font.size = Pt(17)
        run.font.bold = True
        run.font.color.rgb = self.COLOR_NAVY

    def h2(self, text):
        p = self.doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(clean_xml_string(text))
        run.font.name = 'Calibri'
        run.font.size = Pt(13)
        run.font.bold = True
        run.font.color.rgb = self.COLOR_TEAL

    def h3(self, text):
        p = self.doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(clean_xml_string(text))
        run.font.name = 'Calibri'
        run.font.size = Pt(11.5)
        run.font.bold = True
        run.font.color.rgb = self.COLOR_NAVY

    def p(self, text):
        p = self.doc.add_paragraph()
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(clean_xml_string(text))
        run.font.name = 'Calibri'
        run.font.size = Pt(10.5)
        run.font.color.rgb = self.COLOR_DARK
        return p

    def bullet(self, text, prefix=None):
        p = self.doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        if prefix:
            run_p = p.add_run(clean_xml_string(prefix))
            run_p.font.name = 'Calibri'
            run_p.font.size = Pt(10.5)
            run_p.font.bold = True
            run_p.font.color.rgb = self.COLOR_NAVY
        run_t = p.add_run(clean_xml_string(text))
        run_t.font.name = 'Calibri'
        run_t.font.size = Pt(10.5)
        run_t.font.color.rgb = self.COLOR_DARK
        return p

    def callout(self, text, title="IMPORTANT NOTICE"):
        table = self.doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = table.cell(0, 0)
        cell.width = Inches(6.5)
        
        self.set_cell_background(cell, self.HEX_CALLOUT_BG)
        self.set_cell_margins(cell, top=140, bottom=140, left=200, right=180)
        self.set_cell_border(cell, left={"sz": 24, "val": "single", "color": self.HEX_TEAL})

        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(4)
        r_title = p.add_run(clean_xml_string(f"[{title}]\n"))
        r_title.font.name = 'Calibri'
        r_title.font.size = Pt(10.5)
        r_title.font.bold = True
        r_title.font.color.rgb = self.COLOR_TEAL

        r_text = p.add_run(clean_xml_string(text))
        r_text.font.name = 'Calibri'
        r_text.font.size = Pt(10)
        r_text.font.color.rgb = self.COLOR_DARK

        p_spacer = self.doc.add_paragraph()
        p_spacer.paragraph_format.space_after = Pt(4)

    def table(self, headers, data, col_widths=None):
        table = self.doc.add_table(rows=len(data) + 1, cols=len(headers))
        table.alignment = WD_TABLE_ALIGNMENT.CENTER

        # Header Row
        for col_idx, header in enumerate(headers):
            cell = table.cell(0, col_idx)
            if col_widths and col_idx < len(col_widths):
                cell.width = Inches(col_widths[col_idx])
            self.set_cell_background(cell, self.HEX_NAVY)
            self.set_cell_margins(cell, top=140, bottom=140, left=150, right=150)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(clean_xml_string(header))
            r.font.name = 'Calibri'
            r.font.size = Pt(10)
            r.font.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)

        # Data Rows
        for row_idx, row_values in enumerate(data):
            fill = self.HEX_ALT_ROW if row_idx % 2 == 1 else "FFFFFF"
            for col_idx, val in enumerate(row_values):
                cell = table.cell(row_idx + 1, col_idx)
                if col_widths and col_idx < len(col_widths):
                    cell.width = Inches(col_widths[col_idx])
                self.set_cell_background(cell, fill)
                self.set_cell_margins(cell, top=100, bottom=100, left=150, right=150)
                self.set_cell_border(cell, 
                    top={"sz": 2, "val": "single", "color": self.HEX_BORDER},
                    bottom={"sz": 2, "val": "single", "color": self.HEX_BORDER},
                    left={"sz": 2, "val": "single", "color": self.HEX_BORDER},
                    right={"sz": 2, "val": "single", "color": self.HEX_BORDER}
                )
                p = cell.paragraphs[0]
                p.paragraph_format.space_after = Pt(0)
                p.paragraph_format.line_spacing = 1.15
                r = p.add_run(clean_xml_string(str(val)))
                r.font.name = 'Calibri'
                r.font.size = Pt(9.5)
                r.font.color.rgb = self.COLOR_DARK

        p_spacer = self.doc.add_paragraph()
        p_spacer.paragraph_format.space_after = Pt(6)

    def viva_qa(self, q_num, question, simple_ans, tech_ans, category=None):
        # Container Table
        table = self.doc.add_table(rows=3, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        
        # Header / Question Cell
        c_q = table.cell(0, 0)
        c_q.width = Inches(6.5)
        self.set_cell_background(c_q, self.HEX_LIGHT_BG)
        self.set_cell_margins(c_q, top=120, bottom=100, left=160, right=160)
        self.set_cell_border(c_q, 
            top={"sz": 8, "val": "single", "color": self.HEX_NAVY},
            left={"sz": 8, "val": "single", "color": self.HEX_NAVY},
            right={"sz": 8, "val": "single", "color": self.HEX_NAVY},
            bottom={"sz": 2, "val": "single", "color": self.HEX_BORDER}
        )
        p_q = c_q.paragraphs[0]
        p_q.paragraph_format.space_after = Pt(0)
        r_q_num = p_q.add_run(clean_xml_string(f"QUESTION {q_num}: "))
        r_q_num.font.bold = True
        r_q_num.font.color.rgb = self.COLOR_NAVY
        r_q = p_q.add_run(clean_xml_string(question))
        r_q.font.bold = True
        r_q.font.color.rgb = self.COLOR_DARK

        # Simple Answer Cell
        c_s = table.cell(1, 0)
        c_s.width = Inches(6.5)
        self.set_cell_background(c_s, "FFFFFF")
        self.set_cell_margins(c_s, top=100, bottom=100, left=160, right=160)
        self.set_cell_border(c_s, 
            left={"sz": 8, "val": "single", "color": self.HEX_NAVY},
            right={"sz": 8, "val": "single", "color": self.HEX_NAVY},
            bottom={"sz": 2, "val": "dashed", "color": self.HEX_BORDER}
        )
        p_s = c_s.paragraphs[0]
        p_s.paragraph_format.space_after = Pt(0)
        r_s_tag = p_s.add_run("🟢 SIMPLE EXPLANATION (For Non-Technical / General Examiners):\n")
        r_s_tag.font.bold = True
        r_s_tag.font.size = Pt(9.5)
        r_s_tag.font.color.rgb = RGBColor(16, 149, 74)
        r_s_txt = p_s.add_run(clean_xml_string(simple_ans))
        r_s_txt.font.size = Pt(10)
        r_s_txt.font.color.rgb = self.COLOR_DARK

        # Technical Answer Cell
        c_t = table.cell(2, 0)
        c_t.width = Inches(6.5)
        self.set_cell_background(c_t, self.HEX_CALLOUT_BG)
        self.set_cell_margins(c_t, top=100, bottom=120, left=160, right=160)
        self.set_cell_border(c_t, 
            left={"sz": 8, "val": "single", "color": self.HEX_NAVY},
            right={"sz": 8, "val": "single", "color": self.HEX_NAVY},
            bottom={"sz": 8, "val": "single", "color": self.HEX_NAVY}
        )
        p_t = c_t.paragraphs[0]
        p_t.paragraph_format.space_after = Pt(0)
        r_t_tag = p_t.add_run("🔵 IN-DEPTH TECHNICAL EXPLANATION (For Software Engineering / Technical Examiners):\n")
        r_t_tag.font.bold = True
        r_t_tag.font.size = Pt(9.5)
        r_t_tag.font.color.rgb = self.COLOR_NAVY
        r_t_txt = p_t.add_run(clean_xml_string(tech_ans))
        r_t_txt.font.size = Pt(10)
        r_t_txt.font.color.rgb = self.COLOR_DARK

        p_spacer = self.doc.add_paragraph()
        p_spacer.paragraph_format.space_after = Pt(4)

def build_master_documentation():
    print("Beginning master documentation generation...")
    builder = DocumentBuilder()
    
    # Cover Page
    print("Adding Cover Page...")
    builder.add_cover_page()

    # Part 1 to 4
    print("Assembling Parts 1 to 4...")
    doc_content_overview.add_part_1(builder)
    doc_content_overview.add_part_2(builder)
    doc_content_overview.add_part_3(builder)
    doc_content_overview.add_part_4(builder)

    # Part 5 to 8
    print("Assembling Parts 5 to 8...")
    doc_content_ai_multilingual.add_part_5(builder)
    doc_content_ai_multilingual.add_part_6(builder)
    doc_content_ai_multilingual.add_part_7(builder)
    doc_content_ai_multilingual.add_part_8(builder)

    # Part 9 to 12
    print("Assembling Parts 9 to 12...")
    doc_content_security_qa.add_part_9(builder)
    doc_content_security_qa.add_part_10(builder)
    doc_content_security_qa.add_part_11(builder)
    doc_content_security_qa.add_part_12(builder)

    # Part 13 (Viva Questions)
    print("Assembling Part 13 (120+ Viva Questions & Answers)...")
    doc_content_viva_qa.add_part_13(builder)

    # Part 14 to 15
    print("Assembling Parts 14 and 15...")
    doc_content_security_qa.add_part_14(builder)
    doc_content_security_qa.add_part_15(builder)

    # Part 16: Save docx file
    output_filename = "COMMUNITY HEALTH WORKERS TOOLKIT — COMPLETE TECHNICAL DOCUMENTATION, PRESENTATION GUIDE & VIVA PREPARATION.docx"
    workspace_path = os.path.join(os.getcwd(), output_filename)
    artifact_dir = r"C:\Users\hp\.gemini\antigravity\brain\cabc04b6-249a-4028-af4f-ce20a02c0379"
    artifact_path = os.path.join(artifact_dir, output_filename)

    print(f"Saving document to: {workspace_path}")
    builder.doc.save(workspace_path)

    try:
        shutil.copy2(workspace_path, artifact_path)
        print(f"Copied to artifact directory: {artifact_path}")
    except Exception as e:
        print(f"Warning copying to artifact directory: {e}")

    file_size_kb = os.path.getsize(workspace_path) / 1024
    print(f"SUCCESS! Master Documentation created successfully. Size: {file_size_kb:.1f} KB")

if __name__ == "__main__":
    build_master_documentation()
