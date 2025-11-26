import os
import json
import tkinter as tk
from tkinter import ttk, messagebox, simpledialog

# Configuration
SOUNDS_DIR = "sounds"
MANIFEST_FILE = "sound_manifest.js"

class SoundManagerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Sound Manager - Workout Log")
        self.root.geometry("800x600")

        self.manifest_data = {
            "themes": {},
            "ambient": [],
            "files": []
        }

        self.load_manifest()
        self.create_widgets()
        self.scan_directory()

    def create_widgets(self):
        # Notebook (Tabs)
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill='both', expand=True, padx=10, pady=10)

        # Tab 1: Themes
        self.tab_themes = ttk.Frame(self.notebook)
        self.notebook.add(self.tab_themes, text="Thèmes")
        self.create_themes_tab()

        # Tab 2: Ambient
        self.tab_ambient = ttk.Frame(self.notebook)
        self.notebook.add(self.tab_ambient, text="Ambiance")
        self.create_ambient_tab()

        # Tab 3: Files (Read-only view)
        self.tab_files = ttk.Frame(self.notebook)
        self.notebook.add(self.tab_files, text="Fichiers détectés")
        self.create_files_tab()

        # Footer Buttons
        frame_footer = ttk.Frame(self.root)
        frame_footer.pack(fill='x', padx=10, pady=10)
        
        btn_scan = ttk.Button(frame_footer, text="🔄 Rescanne Dossier", command=self.scan_directory)
        btn_scan.pack(side='left', padx=5)

        btn_save = ttk.Button(frame_footer, text="💾 Sauvegarder Manifeste", command=self.save_manifest)
        btn_save.pack(side='right', padx=5)

    def create_themes_tab(self):
        frame = ttk.Frame(self.tab_themes)
        frame.pack(fill='both', expand=True, padx=10, pady=10)

        # Help Label
        lbl_help = ttk.Label(frame, text="Exemples: ID='01', Nom='Puissance' | ID='02', Nom='Metal'", font=("Arial", 9, "italic"))
        lbl_help.pack(pady=(0, 10))

        # Treeview
        columns = ('id', 'name')
        self.tree_themes = ttk.Treeview(frame, columns=columns, show='headings')
        self.tree_themes.heading('id', text='ID (ex: 01)')
        self.tree_themes.heading('name', text='Nom (ex: Puissance)')
        self.tree_themes.pack(side='left', fill='both', expand=True)

        # Scrollbar
        scrollbar = ttk.Scrollbar(frame, orient="vertical", command=self.tree_themes.yview)
        scrollbar.pack(side='right', fill='y')
        self.tree_themes.configure(yscrollcommand=scrollbar.set)

        # Buttons
        btn_frame = ttk.Frame(self.tab_themes)
        btn_frame.pack(fill='x', padx=10, pady=5)
        
        ttk.Button(btn_frame, text="Ajouter Thème", command=self.add_theme).pack(side='left', padx=5)
        ttk.Button(btn_frame, text="Supprimer Thème", command=self.delete_theme).pack(side='left', padx=5)

    def create_ambient_tab(self):
        frame = ttk.Frame(self.tab_ambient)
        frame.pack(fill='both', expand=True, padx=10, pady=10)

        self.list_ambient = tk.Listbox(frame, selectmode=tk.MULTIPLE)
        self.list_ambient.pack(side='left', fill='both', expand=True)

        scrollbar = ttk.Scrollbar(frame, orient="vertical", command=self.list_ambient.yview)
        scrollbar.pack(side='right', fill='y')
        self.list_ambient.configure(yscrollcommand=scrollbar.set)

        lbl_info = ttk.Label(self.tab_ambient, text="Sélectionnez les fichiers d'ambiance (Ctrl+Click pour plusieurs)")
        lbl_info.pack(pady=5)

    def create_files_tab(self):
        frame = ttk.Frame(self.tab_files)
        frame.pack(fill='both', expand=True, padx=10, pady=10)
        
        lbl_naming = ttk.Label(frame, text="Convention de nommage: Phase_ThemeID_Nom.mp3\nExemples: Prep_01.mp3, Effort_02_Rock.mp3", foreground="blue")
        lbl_naming.pack(pady=(0, 5))

        self.list_files = tk.Listbox(frame)
        self.list_files.pack(side='left', fill='both', expand=True)

        scrollbar = ttk.Scrollbar(frame, orient="vertical", command=self.list_files.yview)
        scrollbar.pack(side='right', fill='y')
        self.list_files.configure(yscrollcommand=scrollbar.set)

    def load_manifest(self):
        if not os.path.exists(MANIFEST_FILE):
            return

        try:
            with open(MANIFEST_FILE, 'r', encoding='utf-8') as f:
                content = f.read()
                # Extract JSON part (remove "const SOUND_MANIFEST = " and ";")
                start = content.find('{')
                end = content.rfind('}') + 1
                if start != -1 and end != -1:
                    json_str = content[start:end]
                    
                    # 1. Remove comments // ...
                    import re
                    json_str = re.sub(r'//.*', '', json_str)
                    
                    # 2. Quote unquoted keys (e.g. themes: -> "themes":)
                    # Look for word characters followed by colon, not preceded by quote
                    json_str = re.sub(r'(?<!")(\b\w+\b)(?=\s*:)', r'"\1"', json_str)
                    
                    # 3. Remove trailing commas
                    json_str = re.sub(r',\s*}', '}', json_str)
                    json_str = re.sub(r',\s*]', ']', json_str)

                    try:
                        self.manifest_data = json.loads(json_str)
                    except json.JSONDecodeError as e:
                        print(f"JSON Error after cleanup: {e}")
                        # Fallback: try ast.literal_eval if it looks like a python dict now
                        import ast
                        # Replace JS constants
                        py_str = json_str.replace("true", "True").replace("false", "False").replace("null", "None")
                        self.manifest_data = ast.literal_eval(py_str)

        except Exception as e:
            print(f"Erreur chargement manifest: {e}")
            messagebox.showwarning("Attention", f"Impossible de lire le manifeste existant ({e}). Un nouveau sera créé.")
            # Fallback to defaults if parsing fails
            self.manifest_data = {"themes": {}, "ambient": [], "files": []}

    def scan_directory(self):
        if not os.path.exists(SOUNDS_DIR):
            os.makedirs(SOUNDS_DIR)
        
        files = [f for f in os.listdir(SOUNDS_DIR) if f.lower().endswith('.mp3')]
        self.manifest_data['files'] = files
        
        # Update UI
        self.refresh_ui()

    def refresh_ui(self):
        # Themes
        for item in self.tree_themes.get_children():
            self.tree_themes.delete(item)
        for tid, name in self.manifest_data.get('themes', {}).items():
            self.tree_themes.insert('', 'end', values=(tid, name))

        # Files
        self.list_files.delete(0, 'end')
        for f in self.manifest_data['files']:
            self.list_files.insert('end', f)

        # Ambient
        self.list_ambient.delete(0, 'end')
        current_ambients = self.manifest_data.get('ambient', [])
        if isinstance(current_ambients, str): # Handle legacy string format
            current_ambients = [current_ambients]
            
        # Filter out phase sounds from ambient selection list to avoid confusion
        # Phase sounds start with Prep_, Effort_, Rest_, End_
        phase_prefixes = ('Prep_', 'Effort_', 'Rest_', 'End_')
        
        potential_ambients = [f for f in self.manifest_data['files'] if not f.startswith(phase_prefixes)]
        
        # Also include files that are ALREADY selected as ambient, even if they look like phase sounds (user choice)
        for f in current_ambients:
            if f not in potential_ambients and f in self.manifest_data['files']:
                potential_ambients.append(f)
        
        potential_ambients = sorted(list(set(potential_ambients))) # Deduplicate and sort

        for i, f in enumerate(potential_ambients):
            self.list_ambient.insert('end', f)
            if f in current_ambients:
                self.list_ambient.selection_set(i)

    def add_theme(self):
        tid = simpledialog.askstring("Nouveau Thème", "ID du thème (ex: 01):")
        if not tid: return
        name = simpledialog.askstring("Nouveau Thème", "Nom du thème (ex: Puissance):")
        if not name: return

        if 'themes' not in self.manifest_data:
            self.manifest_data['themes'] = {}
        
        self.manifest_data['themes'][tid] = name
        self.refresh_ui()

    def delete_theme(self):
        selected = self.tree_themes.selection()
        if not selected: return
        item = self.tree_themes.item(selected[0])
        tid = item['values'][0]
        del self.manifest_data['themes'][str(tid)] # Ensure key is string
        self.refresh_ui()

    def save_manifest(self):
        # Get selected ambients
        selected_indices = self.list_ambient.curselection()
        selected_files = [self.list_ambient.get(i) for i in selected_indices]
        self.manifest_data['ambient'] = selected_files

        # Generate JS content
        json_str = json.dumps(self.manifest_data, indent=4, ensure_ascii=False)
        js_content = f"const SOUND_MANIFEST = {json_str};\n"

        try:
            with open(MANIFEST_FILE, 'w', encoding='utf-8') as f:
                f.write(js_content)
            messagebox.showinfo("Succès", "Manifeste sauvegardé avec succès!")
        except Exception as e:
            messagebox.showerror("Erreur", f"Erreur lors de la sauvegarde: {e}")

if __name__ == "__main__":
    root = tk.Tk()
    app = SoundManagerApp(root)
    root.mainloop()
