import streamlit as st
import pandas as pd
import numpy as np
import datetime
import os
import io

# ---------------------------------------------------------
# Page Configuration
# ---------------------------------------------------------
st.set_page_config(
    page_title="Courtside Basketball Analytics Dashboard",
    page_icon="🏀",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# ---------------------------------------------------------
# Data Engine & CSV Persistence
# ---------------------------------------------------------
CSV_FILE = "events_log.csv"
COLUMNS = ["Timestamp", "Quarto", "Numero", "Giocatore", "Azione", "Categoria", "Zona"]

def init_csv():
    if not os.path.exists(CSV_FILE):
        df = pd.DataFrame(columns=COLUMNS)
        df.to_csv(CSV_FILE, index=False)

def load_events():
    init_csv()
    try:
        df = pd.read_csv(CSV_FILE)
        df["Numero"] = df["Numero"].astype(str)
        if "Zona" not in df.columns:
            df["Zona"] = "Generica"
        return df
    except Exception:
        return pd.DataFrame(columns=COLUMNS)

def append_event(quarto, numero, giocatore, azione, categoria, zona="Generica"):
    init_csv()
    timestamp = datetime.datetime.now().strftime("%H:%M:%S")
    new_row = pd.DataFrame([{
        "Timestamp": timestamp,
        "Quarto": quarto,
        "Numero": str(numero),
        "Giocatore": giocatore,
        "Azione": azione,
        "Categoria": categoria,
        "Zona": zona
    }])
    new_row.to_csv(CSV_FILE, mode='a', header=False, index=False)

def delete_last_event():
    df = load_events()
    if not df.empty:
        removed_row = df.iloc[-1]
        df = df.iloc[:-1]
        df.to_csv(CSV_FILE, index=False)
        return removed_row
    return None

def reset_csv():
    df = pd.DataFrame(columns=COLUMNS)
    df.to_csv(CSV_FILE, index=False)

# ---------------------------------------------------------
# Default Roster & Court Zone Mapping
# ---------------------------------------------------------
DEFAULT_ROSTER = [
    {"number": "4", "name": "M. Teodosic", "pos": "PG"},
    {"number": "5", "name": "M. Belinelli", "pos": "SG"},
    {"number": "7", "name": "L. Datome", "pos": "SF"},
    {"number": "8", "name": "N. Melli", "pos": "PF"},
    {"number": "9", "name": "D. Gallinari", "pos": "PF"},
    {"number": "11", "name": "A. Bargnani", "pos": "C"},
    {"number": "13", "name": "S. Tonut", "pos": "SG"},
    {"number": "15", "name": "G. Ricci", "pos": "PF"},
    {"number": "18", "name": "M. Spissu", "pos": "PG"},
    {"number": "22", "name": "S. Fontecchio", "pos": "SF"},
    {"number": "33", "name": "A. Polonara", "pos": "PF"},
    {"number": "77", "name": "L. Doncic", "pos": "PG"}
]

COURT_ZONES = {
    "PAINT": {"name": "Paint / Key", "type": "2PT", "val": 2},
    "MID_L": {"name": "Mid-Range Left", "type": "2PT", "val": 2},
    "MID_C": {"name": "Mid-Range Center", "type": "2PT", "val": 2},
    "MID_R": {"name": "Mid-Range Right", "type": "2PT", "val": 2},
    "C3_L": {"name": "Corner 3 Left", "type": "3PT", "val": 3},
    "C3_R": {"name": "Corner 3 Right", "type": "3PT", "val": 3},
    "W3_L": {"name": "Wing 3 Left", "type": "3PT", "val": 3},
    "W3_R": {"name": "Wing 3 Right", "type": "3PT", "val": 3},
    "ARC3_C": {"name": "Top 3 Arc", "type": "3PT", "val": 3}
}

if "roster" not in st.session_state:
    st.session_state.roster = DEFAULT_ROSTER

if "selected_player" not in st.session_state:
    st.session_state.selected_player = None

if "selected_zone_key" not in st.session_state:
    st.session_state.selected_zone_key = "PAINT"

if "current_quarter" not in st.session_state:
    st.session_state.current_quarter = "Q1"

# ---------------------------------------------------------
# Custom Pro Sports Dashboard CSS
# ---------------------------------------------------------
custom_css = """
<style>
    .block-container {
        padding-top: 0.5rem !important;
        padding-bottom: 1.5rem !important;
        padding-left: 0.5rem !important;
        padding-right: 0.5rem !important;
        max-width: 100% !important;
        background-color: #0B0F17;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    
    div.stButton > button {
        width: 100% !important;
        min-height: 48px !important;
        font-size: 0.95rem !important;
        font-weight: 700 !important;
        border-radius: 8px !important;
        border: 1px solid rgba(255, 255, 255, 0.12) !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3) !important;
        transition: all 0.1s ease-in-out !important;
        touch-action: manipulation;
        padding: 6px 10px !important;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    div.stButton > button:active {
        transform: scale(0.96) !important;
    }

    /* Muted Inactive Player Card */
    .player-tile div.stButton > button {
        background-color: #1E293B !important;
        color: #94A3B8 !important;
        border-left: 4px solid #475569 !important;
        text-align: left !important;
    }
    .player-tile div.stButton > button:hover {
        background-color: #334155 !important;
        color: #F8FAFC !important;
    }

    /* HIGH CONTRAST ELECTRIC GOLD ACTIVE PLAYER CARD */
    .player-tile-active div.stButton > button {
        background-color: #FFD700 !important;
        color: #000000 !important;
        border: 3px solid #FFFFFF !important;
        border-left: 8px solid #000000 !important;
        box-shadow: 0 0 22px rgba(255, 215, 0, 0.9) !important;
        font-weight: 900 !important;
    }

    /* Clustered Action Card Containers */
    .action-cluster-card {
        background-color: #161F30;
        border: 1px solid #334155;
        border-radius: 10px;
        padding: 10px 14px;
        margin-bottom: 10px;
    }
    .cluster-title {
        color: #94A3B8;
        font-size: 0.78rem;
        font-weight: 800;
        letter-spacing: 1px;
        text-transform: uppercase;
        margin-bottom: 6px;
    }

    /* Button Colors */
    .btn-shot-made div.stButton > button {
        background-color: #059669 !important;
        color: #ffffff !important;
        font-size: 1.15rem !important;
        border: 1px solid #10B981 !important;
    }
    .btn-shot-miss div.stButton > button {
        background-color: #DC2626 !important;
        color: #ffffff !important;
        font-size: 1.15rem !important;
        border: 1px solid #EF4444 !important;
    }

    .btn-ft-made div.stButton > button {
        background-color: #047857 !important;
        color: #ffffff !important;
    }
    .btn-ft-miss div.stButton > button {
        background-color: #991B1B !important;
        color: #ffffff !important;
    }

    .btn-stl div.stButton > button {
        background-color: #0284C7 !important;
        color: #ffffff !important;
        border: 1px solid #38BDF8 !important;
    }
    .btn-tov div.stButton > button {
        background-color: #E11D48 !important;
        color: #ffffff !important;
        border: 1px solid #FB7185 !important;
    }

    .btn-reb div.stButton > button {
        background-color: #D97706 !important;
        color: #ffffff !important;
    }
    .btn-ast div.stButton > button {
        background-color: #0D9488 !important;
        color: #ffffff !important;
    }
    .btn-foul div.stButton > button {
        background-color: #6D28D9 !important;
        color: #ffffff !important;
    }
    .btn-undo div.stButton > button {
        background-color: #475569 !important;
        color: #F8FAFC !important;
    }

    /* Top Live Stat Summary Header Banner */
    .player-stat-header {
        background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
        border: 2px solid #FFD700;
        border-radius: 10px;
        padding: 10px 18px;
        color: #F8FAFC;
        margin-bottom: 10px;
        box-shadow: 0 4px 14px rgba(255, 215, 0, 0.25);
    }
    .stat-pill {
        background-color: #0F172A;
        border: 1px solid #334155;
        border-radius: 6px;
        padding: 4px 10px;
        font-size: 0.9rem;
        font-weight: 700;
        display: inline-block;
        margin-right: 6px;
        margin-top: 4px;
    }
    .stat-pill-highlight {
        background-color: #FFD700;
        color: #000000;
        border: 1px solid #FFFFFF;
        border-radius: 6px;
        padding: 4px 12px;
        font-size: 1.05rem;
        font-weight: 900;
        display: inline-block;
        margin-right: 6px;
    }

    .pitch-heatmap-container {
        background-color: #0F172A;
        border: 2px solid #FF6B00;
        border-radius: 10px;
        padding: 8px;
        text-align: center;
        margin-bottom: 8px;
    }
</style>
"""
st.markdown(custom_css, unsafe_allow_html=True)

# ---------------------------------------------------------
# Sidebar: Roster Settings & Export
# ---------------------------------------------------------
with st.sidebar:
    st.title("SETTINGS & ROSTER")
    
    updated_roster = []
    with st.expander("Edit Roster Names & Numbers", expanded=False):
        for idx, p in enumerate(st.session_state.roster):
            c1, c2, c3 = st.columns([1, 2, 1])
            with c1:
                num = st.text_input(f"#{idx+1} N°", value=p["number"], key=f"r_num_{idx}")
            with c2:
                name = st.text_input(f"#{idx+1} Name", value=p["name"], key=f"r_name_{idx}")
            with c3:
                pos = st.text_input(f"#{idx+1} Pos", value=p.get("pos", "G"), key=f"r_pos_{idx}")
            updated_roster.append({"number": num, "name": name, "pos": pos})
            
        if st.button("SAVE ROSTER", use_container_width=True):
            st.session_state.roster = updated_roster
            st.success("Roster Saved!")
            st.rerun()

    st.markdown("---")
    events_df = load_events()
    st.write(f"**Total Events:** {len(events_df)}")
    
    csv_data = events_df.to_csv(index=False).encode('utf-8')
    st.download_button(
        label="EXPORT CSV LOG",
        data=csv_data,
        file_name=f"basket_stats_{datetime.datetime.now().strftime('%Y%m%d_%H%M')}.csv",
        mime="text/csv",
        use_container_width=True
    )
    
    if st.button("RESET GAME DATA", type="primary", use_container_width=True):
        st.session_state.confirm_reset = True
        
    if st.session_state.get("confirm_reset", False):
        st.warning("Are you sure you want to clear all game data?")
        c1, c2 = st.columns(2)
        with c1:
            if st.button("YES, CLEAR", use_container_width=True):
                reset_csv()
                st.session_state.selected_player = None
                st.session_state.confirm_reset = False
                st.toast("Game data reset!", icon="🗑️")
                st.rerun()
        with c2:
            if st.button("NO, CANCEL", use_container_width=True):
                st.session_state.confirm_reset = False
                st.rerun()

# ---------------------------------------------------------
# Helper Functions: Player Real-time Stat Line Calculation
# ---------------------------------------------------------
def compute_player_stats(events_df, player_num):
    p_df = events_df[events_df["Numero"] == str(player_num)]
    
    fg2_m = (p_df["Azione"] == "2PT Fatto").sum()
    fg2_miss = (p_df["Azione"] == "2PT Sbagliato").sum()
    fg2_a = fg2_m + fg2_miss
    
    fg3_m = (p_df["Azione"] == "3PT Fatto").sum()
    fg3_miss = (p_df["Azione"] == "3PT Sbagliato").sum()
    fg3_a = fg3_m + fg3_miss
    
    ft_m = (p_df["Azione"] == "TL Fatto").sum()
    ft_miss = (p_df["Azione"] == "TL Sbagliato").sum()
    ft_a = ft_m + ft_miss
    
    pts = (fg2_m * 2) + (fg3_m * 3) + (ft_m * 1)
    oreb = (p_df["Azione"] == "Rimb Offensivo").sum()
    dreb = (p_df["Azione"] == "Rimb Difensivo").sum()
    treb = oreb + dreb
    ast = (p_df["Azione"] == "Assist").sum()
    stl = (p_df["Azione"] == "Palla Recuperata").sum()
    tov = (p_df["Azione"] == "Palla Persa").sum()
    pf = (p_df["Azione"] == "Fallo Fatto").sum()
    fd = (p_df["Azione"] == "Fallo Subito").sum()
    blk = (p_df["Azione"] == "Stoppata Data").sum()
    blka = (p_df["Azione"] == "Stoppata Subita").sum()
    
    pct_2p = (fg2_m / fg2_a * 100) if fg2_a > 0 else 0.0
    pct_3p = (fg3_m / fg3_a * 100) if fg3_a > 0 else 0.0
    pct_ft = (ft_m / ft_a * 100) if ft_a > 0 else 0.0
    
    pir = (pts + treb + ast + stl + blk + fd) - ((fg2_miss + fg3_miss) + ft_miss + tov + pf + blka)
    
    return {
        "pts": pts,
        "2p": f"{fg2_m}/{fg2_a}", "2p_pct": pct_2p,
        "3p": f"{fg3_m}/{fg3_a}", "3p_pct": pct_3p,
        "ft": f"{ft_m}/{ft_a}", "ft_pct": pct_ft,
        "reb": treb, "ast": ast, "stl": stl, "tov": tov,
        "pf": pf, "fd": fd, "blk": blk, "pir": pir
    }

def compute_zone_heatmap_colors(events_df, player_num=None):
    # Filter df by player if selected
    if player_num:
        df = events_df[events_df["Numero"] == str(player_num)]
    else:
        df = events_df
        
    zone_colors = {}
    zone_stats = {}
    
    for z_key, z_info in COURT_ZONES.items():
        z_name = z_info["name"]
        z_df = df[df["Zona"] == z_name]
        
        made = (z_df["Azione"].str.contains("Fatto")).sum()
        attempts = len(z_df)
        
        if attempts == 0:
            color = "#1E293B" # Dark Neutral Slate
            label = z_info["name"].upper()
        else:
            pct = (made / attempts * 100)
            if pct >= 50.0:
                color = "#059669" # Emerald Green
            elif pct >= 33.0:
                color = "#D97706" # Amber / Yellow
            else:
                color = "#DC2626" # Red
            label = f"{made}/{attempts} ({pct:.0f}%)"
            
        zone_colors[z_key] = color
        zone_stats[z_key] = label
        
    return zone_colors, zone_stats

# ---------------------------------------------------------
# Main App Tabs
# ---------------------------------------------------------
tab_live, tab_box = st.tabs(["LIVE COURTSIDE TRACKING", "BOX SCORE & SHOT ANALYTICS"])

# =========================================================
# TAB 1: LIVE COURTSIDE DASHBOARD
# =========================================================
with tab_live:
    df_events = load_events()
    
    # Header Banner Layout
    sc_col1, sc_col2, sc_col3 = st.columns([1.5, 7, 1.5])
    
    with sc_col1:
        st.session_state.current_quarter = st.selectbox(
            "QUARTER",
            ["Q1", "Q2", "Q3", "Q4", "OT1", "OT2"],
            index=["Q1", "Q2", "Q3", "Q4", "OT1", "OT2"].index(st.session_state.current_quarter)
            if st.session_state.current_quarter in ["Q1", "Q2", "Q3", "Q4", "OT1", "OT2"] else 0,
            label_visibility="collapsed"
        )
        
    with sc_col2:
        if st.session_state.selected_player:
            p = st.session_state.selected_player
            p_stats = compute_player_stats(df_events, p["number"])
            
            st.markdown(
                f'<div class="player-stat-header">'
                f'<div style="display:flex; justify-content:space-between; align-items:center;">'
                f'<div>'
                f'<span class="stat-pill-highlight">#{p["number"]} {p["name"]} ({p["pos"]})</span>'
                f'<span class="stat-pill" style="color:#FFD700;">{p_stats["pts"]} PTS</span>'
                f'<span class="stat-pill">2P: {p_stats["2p"]} ({p_stats["2p_pct"]:.0f}%)</span>'
                f'<span class="stat-pill">3P: {p_stats["3p"]} ({p_stats["3p_pct"]:.0f}%)</span>'
                f'<span class="stat-pill">FT: {p_stats["ft"]}</span>'
                f'<span class="stat-pill">REB: {p_stats["reb"]}</span>'
                f'<span class="stat-pill">AST: {p_stats["ast"]}</span>'
                f'<span class="stat-pill">STL: {p_stats["stl"]}</span>'
                f'<span class="stat-pill">TOV: {p_stats["tov"]}</span>'
                f'<span class="stat-pill">PF: {p_stats["pf"]}</span>'
                f'<span class="stat-pill" style="color:#38BDF8;">PIR: {p_stats["pir"]}</span>'
                f'</div>'
                f'</div>'
                f'</div>',
                unsafe_allow_html=True
            )
        else:
            # Team Totals Header when no player selected
            team_pts = (df_events["Azione"] == "2PT Fatto").sum() * 2 + (df_events["Azione"] == "3PT Fatto").sum() * 3 + (df_events["Azione"] == "TL Fatto").sum() * 1
            st.markdown(
                f'<div class="player-stat-header" style="border-color:#334155;">'
                f'<div style="display:flex; justify-content:space-between; align-items:center;">'
                f'<div>'
                f'<span style="background-color:#1E293B; color:#F1F5F9; padding:4px 12px; border-radius:6px; font-weight:800; font-size:1rem; margin-right:10px;">TEAM SCORE: {team_pts} PTS</span>'
                f'<span style="color:#94A3B8; font-weight:700; font-size:0.95rem;">👈 SELECT A PLAYER CARD TO VIEW INDIVIDUAL LIVE STATS</span>'
                f'</div>'
                f'</div>'
                f'</div>',
                unsafe_allow_html=True
            )
            
    with sc_col3:
        st.markdown('<div class="btn-undo">', unsafe_allow_html=True)
        if st.button("UNDO PLAY", use_container_width=True):
            removed = delete_last_event()
            if removed is not None:
                st.toast(f"Undone: #{removed['Numero']} {removed['Azione']}")
                st.rerun()
            else:
                st.toast("No plays to undo!")
        st.markdown('</div>', unsafe_allow_html=True)

    # Main 2-Column Split Layout (Roster Left, Heatmap & Action Clusters Right)
    col_roster, col_actions = st.columns([3, 7])
    
    # ---------------------------------------------------------
    # PANEL 1 (LEFT): High-Contrast Single-Tap Player Selector
    # ---------------------------------------------------------
    with col_roster:
        st.markdown("<h4 style='margin-bottom:8px; color:#F8FAFC; font-weight:800;'>SELECT ACTIVE PLAYER</h4>", unsafe_allow_html=True)
        
        roster = st.session_state.roster
        for p in roster:
            is_selected = (
                st.session_state.selected_player is not None and
                st.session_state.selected_player["number"] == p["number"]
            )
            
            tile_class = "player-tile-active" if is_selected else "player-tile"
            st.markdown(f'<div class="{tile_class}">', unsafe_allow_html=True)
            
            # Show live points for each player on card
            p_pts = compute_player_stats(df_events, p["number"])["pts"]
            btn_label = f"#{p['number']}  {p['name']} ({p['pos']})  |  {p_pts} PTS"
            if is_selected:
                btn_label = f"[ ACTIVE ] #{p['number']} {p['name']} ({p_pts} PTS)"
                
            if st.button(btn_label, key=f"btn_p_{p['number']}", use_container_width=True):
                if is_selected:
                    st.session_state.selected_player = None
                else:
                    st.session_state.selected_player = p
                st.rerun()
                
            st.markdown('</div>', unsafe_allow_html=True)

    # ---------------------------------------------------------
    # PANEL 2 (RIGHT): Dynamic Heatmap Pitch & Clustered Action Cards
    # ---------------------------------------------------------
    with col_actions:
        st.markdown("<h4 style='margin-bottom:8px; color:#F8FAFC; font-weight:800;'>COURT SHOT HEATMAP & ACTION ENTRY</h4>", unsafe_allow_html=True)
        
        # Calculate dynamic zone colors for active player (or team if none selected)
        active_num = st.session_state.selected_player["number"] if st.session_state.selected_player else None
        z_colors, z_labels = compute_zone_heatmap_colors(df_events, active_num)
        
        # Stroke helper for currently selected zone
        def get_stroke(z_key):
            if z_key == st.session_state.selected_zone_key:
                return 'stroke="#06B6D4" stroke-width="6"'
            return 'stroke="#FF6B00" stroke-width="2.5"'

        # SVG Pitch Heatmap Render
        st.markdown(
            f'<div class="pitch-heatmap-container">'
            f'<svg viewBox="0 0 600 380" width="100%" height="240" style="background:#0F172A; border-radius:8px;">'
            f'  <!-- Court Outer Border -->'
            f'  <rect x="10" y="10" width="580" height="360" fill="none" stroke="#FF6B00" stroke-width="4"/>'
            f'  <!-- PAINT (2PT) -->'
            f'  <rect x="210" y="10" width="180" height="170" fill="{z_colors["PAINT"]}" fill-opacity="0.75" {get_stroke("PAINT")}/>'
            f'  <!-- Free Throw Circle -->'
            f'  <circle cx="300" cy="180" r="55" fill="none" stroke="#FF6B00" stroke-width="3" stroke-dasharray="5"/>'
            f'  <!-- MID RANGE LEFT -->'
            f'  <path d="M 60 90 L 210 90 L 210 180 A 55 55 0 0 0 300 180 L 300 250 A 240 240 0 0 1 60 90" fill="{z_colors["MID_L"]}" fill-opacity="0.65" {get_stroke("MID_L")}/>'
            f'  <!-- MID RANGE RIGHT -->'
            f'  <path d="M 540 90 L 390 90 L 390 180 A 55 55 0 0 1 300 180 L 300 250 A 240 240 0 0 0 540 90" fill="{z_colors["MID_R"]}" fill-opacity="0.65" {get_stroke("MID_R")}/>'
            f'  <!-- 3PT Arc Lines -->'
            f'  <path d="M 60 10 L 60 90 A 240 240 0 0 0 540 90 L 540 10" fill="none" stroke="#FF6B00" stroke-width="4"/>'
            f'  <!-- Backboard & Rim -->'
            f'  <line x1="260" y1="28" x2="340" y2="28" stroke="#FFFFFF" stroke-width="5"/>'
            f'  <circle cx="300" cy="45" r="16" fill="none" stroke="#FF6B00" stroke-width="4"/>'
            f'  <!-- Zone Overlay Text Labels -->'
            f'  <text x="300" y="95" fill="#FFFFFF" font-size="15" font-weight="900" text-anchor="middle">{z_labels["PAINT"]}</text>'
            f'  <text x="130" y="130" fill="#FFFFFF" font-size="12" font-weight="800" text-anchor="middle">{z_labels["MID_L"]}</text>'
            f'  <text x="470" y="130" fill="#FFFFFF" font-size="12" font-weight="800" text-anchor="middle">{z_labels["MID_R"]}</text>'
            f'  <text x="35" y="55" fill="#38BDF8" font-size="11" font-weight="800" text-anchor="middle">{z_labels["C3_L"]}</text>'
            f'  <text x="565" y="55" fill="#38BDF8" font-size="11" font-weight="800" text-anchor="end">{z_labels["C3_R"]}</text>'
            f'  <text x="130" y="270" fill="#38BDF8" font-size="12" font-weight="800" text-anchor="middle">{z_labels["W3_L"]}</text>'
            f'  <text x="470" y="270" fill="#38BDF8" font-size="12" font-weight="800" text-anchor="middle">{z_labels["W3_R"]}</text>'
            f'  <text x="300" y="320" fill="#38BDF8" font-size="14" font-weight="900" text-anchor="middle">{z_labels["ARC3_C"]}</text>'
            f'</svg>'
            f'</div>',
            unsafe_allow_html=True
        )

        # Select Court Zone Selector
        zone_keys = list(COURT_ZONES.keys())
        zone_labels = [f"{v['name']} [{v['type']}]" for v in COURT_ZONES.values()]
        
        selected_index = 0
        if st.session_state.selected_zone_key in zone_keys:
            selected_index = zone_keys.index(st.session_state.selected_zone_key)
            
        selected_label = st.radio(
            "SELECT TARGET COURT ZONE:",
            zone_labels,
            index=selected_index,
            horizontal=True
        )
        
        for k, v in COURT_ZONES.items():
            if f"{v['name']} [{v['type']}]" == selected_label:
                st.session_state.selected_zone_key = k
                break

        current_zone_info = COURT_ZONES[st.session_state.selected_zone_key]

        # Action Handler
        def record_shot(is_made):
            if not st.session_state.selected_player:
                st.toast("⚠️ Select a player first on the left panel!")
                return
            
            p = st.session_state.selected_player
            zone_info = COURT_ZONES[st.session_state.selected_zone_key]
            
            shot_type = zone_info["type"]
            outcome = "Fatto" if is_made else "Sbagliato"
            action_name = f"{shot_type} {outcome}"
            
            append_event(
                quarto=st.session_state.current_quarter,
                numero=p["number"],
                giocatore=p["name"],
                azione=action_name,
                categoria="Tiro",
                zona=zone_info["name"]
            )
            
            st.toast(f"#{p['number']} {p['name']} ➔ {action_name} ({zone_info['name']})")
            st.session_state.selected_player = None
            st.rerun()

        def record_other_action(azione, categoria):
            if not st.session_state.selected_player:
                st.toast("⚠️ Select a player first on the left panel!")
                return
            
            p = st.session_state.selected_player
            append_event(
                quarto=st.session_state.current_quarter,
                numero=p["number"],
                giocatore=p["name"],
                azione=azione,
                categoria=categoria,
                zona="Generica"
            )
            
            st.toast(f"#{p['number']} {p['name']} ➔ {azione}")
            st.session_state.selected_player = None
            st.rerun()

        # ---------------------------------------------------------
        # 5 ORGANIZED ACTION CLUSTERS
        # ---------------------------------------------------------
        
        # CLUSTER 1: FIELD GOALS (Auto-Crossed with Selected Zone)
        st.markdown('<div class="action-cluster-card">', unsafe_allow_html=True)
        st.markdown(f'<div class="cluster-title">1. FIELD GOAL ACTION — TARGET ZONE: {current_zone_info["name"].upper()} ({current_zone_info["type"]})</div>', unsafe_allow_html=True)
        sb1, sb2 = st.columns(2)
        with sb1:
            st.markdown('<div class="btn-shot-made">', unsafe_allow_html=True)
            if st.button(f"SHOT MADE ({current_zone_info['type']})", key="act_shot_m", use_container_width=True):
                record_shot(is_made=True)
            st.markdown('</div>', unsafe_allow_html=True)
            
        with sb2:
            st.markdown('<div class="btn-shot-miss">', unsafe_allow_html=True)
            if st.button(f"SHOT MISSED ({current_zone_info['type']})", key="act_shot_miss", use_container_width=True):
                record_shot(is_made=False)
            st.markdown('</div>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)

        # CLUSTER 2: FREE THROWS (TL)
        st.markdown('<div class="action-cluster-card">', unsafe_allow_html=True)
        st.markdown('<div class="cluster-title">2. FREE THROWS (TL)</div>', unsafe_allow_html=True)
        fb1, fb2 = st.columns(2)
        with fb1:
            st.markdown('<div class="btn-ft-made">', unsafe_allow_html=True)
            if st.button("FT MADE", key="act_ft_m", use_container_width=True):
                record_other_action("TL Fatto", "Tiro")
            st.markdown('</div>', unsafe_allow_html=True)
            
        with fb2:
            st.markdown('<div class="btn-ft-miss">', unsafe_allow_html=True)
            if st.button("FT MISSED", key="act_ft_miss", use_container_width=True):
                record_other_action("TL Sbagliato", "Tiro")
            st.markdown('</div>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)

        # CLUSTER 3: POSSESSION & DEFENSE (STEALS & TURNOVERS)
        st.markdown('<div class="action-cluster-card">', unsafe_allow_html=True)
        st.markdown('<div class="cluster-title">3. POSSESSION & DEFENSE</div>', unsafe_allow_html=True)
        db1, db2, db3 = st.columns(3)
        with db1:
            st.markdown('<div class="btn-stl">', unsafe_allow_html=True)
            if st.button("STEAL (STL)", key="act_stl", use_container_width=True):
                record_other_action("Palla Recuperata", "Difesa")
            st.markdown('</div>', unsafe_allow_html=True)

        with db2:
            st.markdown('<div class="btn-tov">', unsafe_allow_html=True)
            if st.button("TURNOVER (TOV)", key="act_tov", use_container_width=True):
                record_other_action("Palla Persa", "Errore")
            st.markdown('</div>', unsafe_allow_html=True)

        with db3:
            st.markdown('<div class="btn-foul">', unsafe_allow_html=True)
            if st.button("BLOCK (BLK)", key="act_blk", use_container_width=True):
                record_other_action("Stoppata Data", "Difesa")
            st.markdown('</div>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)

        # CLUSTER 4: REBOUNDS & PLAYMAKING
        st.markdown('<div class="action-cluster-card">', unsafe_allow_html=True)
        st.markdown('<div class="cluster-title">4. REBOUNDS & PLAYMAKING</div>', unsafe_allow_html=True)
        rb1, rb2, rb3 = st.columns(3)
        with rb1:
            st.markdown('<div class="btn-reb">', unsafe_allow_html=True)
            if st.button("OFF REBOUND", key="act_oreb", use_container_width=True):
                record_other_action("Rimb Offensivo", "Rimbalzo")
            st.markdown('</div>', unsafe_allow_html=True)

        with rb2:
            st.markdown('<div class="btn-reb">', unsafe_allow_html=True)
            if st.button("DEF REBOUND", key="act_dreb", use_container_width=True):
                record_other_action("Rimb Difensivo", "Rimbalzo")
            st.markdown('</div>', unsafe_allow_html=True)

        with rb3:
            st.markdown('<div class="btn-ast">', unsafe_allow_html=True)
            if st.button("ASSIST (AST)", key="act_ast", use_container_width=True):
                record_other_action("Assist", "Passaggio")
            st.markdown('</div>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)

        # CLUSTER 5: FOULS
        st.markdown('<div class="action-cluster-card">', unsafe_allow_html=True)
        st.markdown('<div class="cluster-title">5. FOULS & DRAWN FOULS</div>', unsafe_allow_html=True)
        fl1, fl2 = st.columns(2)
        with fl1:
            st.markdown('<div class="btn-foul">', unsafe_allow_html=True)
            if st.button("PERSONAL FOUL (PF)", key="act_pf", use_container_width=True):
                record_other_action("Fallo Fatto", "Fallo")
            st.markdown('</div>', unsafe_allow_html=True)

        with fl2:
            st.markdown('<div class="btn-ast">', unsafe_allow_html=True)
            if st.button("FOUL DRAWN (FD)", key="act_fd", use_container_width=True):
                record_other_action("Fallo Subito", "Fallo")
            st.markdown('</div>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)

    # ---------------------------------------------------------
    # BOTTOM PANEL: RELOCATED RECENT PLAY STREAM OVERVIEW
    # ---------------------------------------------------------
    st.markdown("---")
    st.markdown("<h4 style='color:#F8FAFC; font-weight:800;'>📜 RECENT PLAY LOG OVERVIEW</h4>", unsafe_allow_html=True)
    
    if df_events.empty:
        st.info("No events logged in the game yet.")
    else:
        recent_df = df_events.iloc[::-1].head(10)
        st.dataframe(recent_df, use_container_width=True, hide_index=True)


# =========================================================
# TAB 2: BOX SCORE & SHOT CHART ANALYTICS
# =========================================================
with tab_box:
    st.header("OFFICIAL FIBA BOX SCORE & SHOT ANALYTICS")
    
    df_events = load_events()
    
    if df_events.empty:
        st.info("No events logged yet. Use the Live Tracking Dashboard to record actions.")
    else:
        tb_col1, tb_col2 = st.columns([6, 4])
        
        with tb_col1:
            st.subheader("FIBA Box Score Table")
            
            roster_players = {str(p["number"]): (p["name"], p.get("pos", "G")) for p in st.session_state.roster}
            log_nums = df_events["Numero"].unique()
            all_nums = list(dict.fromkeys(list(roster_players.keys()) + [str(n) for n in log_nums]))
            
            rows = []
            for num in all_nums:
                num_str = str(num)
                p_df = df_events[df_events["Numero"] == num_str]
                
                if num_str in roster_players:
                    name, pos = roster_players[num_str]
                else:
                    name = p_df["Giocatore"].iloc[0] if not p_df.empty else f"Player #{num_str}"
                    pos = "-"
                
                fg2_m = (p_df["Azione"] == "2PT Fatto").sum()
                fg2_miss = (p_df["Azione"] == "2PT Sbagliato").sum()
                fg2_a = fg2_m + fg2_miss
                
                fg3_m = (p_df["Azione"] == "3PT Fatto").sum()
                fg3_miss = (p_df["Azione"] == "3PT Sbagliato").sum()
                fg3_a = fg3_m + fg3_miss
                
                ft_m = (p_df["Azione"] == "TL Fatto").sum()
                ft_miss = (p_df["Azione"] == "TL Sbagliato").sum()
                ft_a = ft_m + ft_miss
                
                pts = (fg2_m * 2) + (fg3_m * 3) + (ft_m * 1)
                oreb = (p_df["Azione"] == "Rimb Offensivo").sum()
                dreb = (p_df["Azione"] == "Rimb Difensivo").sum()
                treb = oreb + dreb
                ast = (p_df["Azione"] == "Assist").sum()
                stl = (p_df["Azione"] == "Palla Recuperata").sum()
                tov = (p_df["Azione"] == "Palla Persa").sum()
                pf = (p_df["Azione"] == "Fallo Fatto").sum()
                fd = (p_df["Azione"] == "Fallo Subito").sum()
                blk = (p_df["Azione"] == "Stoppata Data").sum()
                blka = (p_df["Azione"] == "Stoppata Subita").sum()
                
                pct_2p = (fg2_m / fg2_a * 100) if fg2_a > 0 else 0.0
                pct_3p = (fg3_m / fg3_a * 100) if fg3_a > 0 else 0.0
                pct_ft = (ft_m / ft_a * 100) if ft_a > 0 else 0.0
                
                pir = (pts + treb + ast + stl + blk + fd) - ((fg2_miss + fg3_miss) + ft_miss + tov + pf + blka)
                
                rows.append({
                    "N°": f"#{num_str}",
                    "PLAYER": f"{name} ({pos})",
                    "PTS": pts,
                    "2PM/2PA": f"{fg2_m}/{fg2_a}",
                    "2P %": f"{pct_2p:.0f}%",
                    "3PM/3PA": f"{fg3_m}/{fg3_a}",
                    "3P %": f"{pct_3p:.0f}%",
                    "FTM/FTA": f"{ft_m}/{ft_a}",
                    "FT %": f"{pct_ft:.0f}%",
                    "REB": treb,
                    "AST": ast,
                    "STL": stl,
                    "TOV": tov,
                    "PF": pf,
                    "PIR": pir,
                    "_pts": pts, "_actions": len(p_df)
                })

            box_df = pd.DataFrame(rows).sort_values(by=["_actions", "PTS"], ascending=[False, False])
            
            st.dataframe(
                box_df.drop(columns=["_pts", "_actions"]),
                use_container_width=True,
                hide_index=True
            )

        with tb_col2:
            st.subheader("Shot Zone Efficiency Chart")
            
            shots_df = df_events[df_events["Azione"].isin(["2PT Fatto", "2PT Sbagliato", "3PT Fatto", "3PT Sbagliato"])]
            
            if shots_df.empty:
                st.info("No field goal attempts logged yet.")
            else:
                zone_summary = []
                for zone_name in shots_df["Zona"].unique():
                    z_df = shots_df[shots_df["Zona"] == zone_name]
                    made = (z_df["Azione"].str.contains("Fatto")).sum()
                    attempts = len(z_df)
                    pct = (made / attempts * 100) if attempts > 0 else 0.0
                    zone_summary.append({
                        "Court Zone": zone_name,
                        "Made / Att": f"{made}/{attempts}",
                        "FG %": f"{pct:.1f}%"
                    })
                
                st.dataframe(pd.DataFrame(zone_summary), use_container_width=True, hide_index=True)
