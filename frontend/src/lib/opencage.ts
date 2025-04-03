import axios from "axios";

const OPENCAGE_API_KEY = "a215b818f15c46b8b9e266a90ed47ce8";
const OPENCAGE_API_URL = "https://api.opencagedata.com/geocode/v1/json";

interface OpenCageResult {
  formatted: string;
  geometry: {
    lat: number;
    lng: number;
  };
  components: {
    country?: string;
    state?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    [key: string]: string | undefined;
  };
}

interface OpenCageResponse {
  results: OpenCageResult[];
  status: {
    code: number;
    message: string;
  };
}

export async function searchLocations(
  query: string
): Promise<OpenCageResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const response = await axios.get<OpenCageResponse>(OPENCAGE_API_URL, {
      params: {
        q: query,
        key: OPENCAGE_API_KEY,
        limit: 10, // Aumentando o limite para ter mais resultados para ordenar
        language: "pt-BR",
        no_annotations: 1,
        countrycode: "br", // Priorizando resultados do Brasil
      },
    });

    if (response.data.status.code === 200) {
      // Ordenando resultados para priorizar locais do Brasil
      const results = response.data.results;

      // Função para verificar se o resultado é do Brasil
      const isBrazilian = (result: OpenCageResult) =>
        result.components.country === "Brazil" ||
        result.components.country === "Brasil";

      // Ordenando: primeiro os resultados do Brasil, depois os demais
      const sortedResults = [
        ...results.filter(isBrazilian),
        ...results.filter((result) => !isBrazilian(result)),
      ].slice(0, 5); // Limitando a 5 resultados no total

      return sortedResults;
    }

    return [];
  } catch (error) {
    console.error("Erro ao buscar localizações:", error);
    return [];
  }
}

export function formatLocationResult(result: OpenCageResult): string {
  // Formatação especial para resultados do Brasil
  if (
    result.components.country === "Brazil" ||
    result.components.country === "Brasil"
  ) {
    // Obtendo os componentes relevantes
    const city =
      result.components.city ||
      result.components.town ||
      result.components.village ||
      result.components.county ||
      "";
    const state = result.components.state || "";

    // Formatando para exibir "Cidade, Estado - Brasil"
    if (city && state) {
      return `${city}, ${state} - Brasil`;
    } else if (state) {
      return `${state} - Brasil`;
    }
  }

  // Para outros países, mantém o formato padrão
  return result.formatted;
}
