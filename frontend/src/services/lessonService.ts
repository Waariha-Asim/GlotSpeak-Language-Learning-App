import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/api/lessons`;

export const getLessons = async () => (await axios.get(API_URL)).data;
export const updateLesson = async (id: string, body: any) =>
  (await axios.put(`${API_URL}/${id}`, body)).data;
