import { apiClient, BaseResponse } from "./apiClient";

export interface Template {
  id: number;
  displayUrl: string;
  productionUrl: string;
  tenantId: number;
  tenantName: string;
  layoutId: number;
  isDefault: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface ResultTemplate {
  total: number;
  templates: Template[];
}

export interface TemplateListParams {
  tenantId: number;
  keyword: string;
  page: number;
  limit: number;
}

export async function getTemplates(
  request: TemplateListParams,
): Promise<BaseResponse<ResultTemplate>> {
  try {
    const res = await apiClient.post<BaseResponse<ResultTemplate>>(
      "/template/get",
      request,
    );
    return res.data;
  } catch (error) {
    console.error("Error fetching template:", error);
    throw error;
  }
}
