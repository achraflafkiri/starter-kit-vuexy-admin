import api from "../http-service";

interface Assistant {
    id: number;
    name: string;
    language: string;
    prompt: string;
    whoSpeaksFirst: string;
    customGreeting: string;
    tags: string[];
}

// List Assistants
export const getAssistants = () => api.get<Assistant[]>(`/assistant`);

// Get Assistant
export const getAssistant = (id: number) => api.get<Assistant>(`/assistant/${id}`);

// Create Assistant
export const createAssistant = (data: Partial<Assistant>) => api.post<Assistant>(`/assistant/`, data);

// Update Assistant
export const updateAssistant = (id: number, data: Partial<Assistant>) => api.patch<Assistant>(`/assistant/${id}`, data);

// Delete Assistant
export const deleteAssistant = (id: number) => api.delete(`/assistant/${id}`);

// Call Assistant
export const callAssistant = (data: any) => api.post<Assistant>(`/call`, data);
