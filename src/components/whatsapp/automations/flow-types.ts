export interface FlowNode {
  id?: string | number;
  name: string;
  node_type: "TEXT" | "LIST" | "ROUTE" | "NUMBER" | "BUTTONS";
  header_text_template: {
    id?: number;
    language: string;
    text: string;
  };
  header_text_template_id?: number;
  backend_enabled: boolean;
  exit_enabled: boolean;
  extra_data: {
    position?: { x: number; y: number };
    options?: { value: string; target_index: number | null }[];
    [key: string]: any;
  };
  parent_index?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}
