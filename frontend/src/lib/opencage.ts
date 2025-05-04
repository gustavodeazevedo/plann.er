import axios from "axios";

// API key fixa que funcionava anteriormente
const OPENCAGE_API_KEY = "a215b818f15c46b8b9e266a90ed47ce8";
const OPENCAGE_API_URL = "https://api.opencagedata.com/geocode/v1/json";

/**
 * Tipos para a API OpenCage
 */
export interface OpenCageResult {
  formatted: string;
  geometry: {
    lat: number;
    lng: number;
  };
  components: {
    city?: string;
    state?: string;
    country?: string;
    country_code?: string;
    town?: string;
    village?: string;
    county?: string;
    [key: string]: string | undefined;
  };
  annotations?: {
    timezone?: {
      name: string;
    };
    flag?: string;
  };
}

export interface OpenCageResponse {
  results: OpenCageResult[];
  status: {
    code: number;
    message: string;
  };
  total_results: number;
}

// Exemplos de localizações para modo de desenvolvimento quando a API não está disponível
const EXAMPLE_LOCATIONS: Record<string, OpenCageResult[]> = {
  rio: [
    {
      formatted: "Rio de Janeiro, Brasil",
      geometry: { lat: -22.9068, lng: -43.1729 },
      components: {
        city: "Rio de Janeiro",
        state: "Rio de Janeiro",
        country: "Brasil",
        country_code: "br",
      },
    },
    {
      formatted: "Rio Grande do Sul, Brasil",
      geometry: { lat: -30.0346, lng: -51.2177 },
      components: {
        state: "Rio Grande do Sul",
        country: "Brasil",
        country_code: "br",
      },
    },
  ],
  sao: [
    {
      formatted: "São Paulo, Brasil",
      geometry: { lat: -23.5505, lng: -46.6333 },
      components: {
        city: "São Paulo",
        state: "São Paulo",
        country: "Brasil",
        country_code: "br",
      },
    },
    {
      formatted: "São Luís, Maranhão, Brasil",
      geometry: { lat: -2.5391, lng: -44.2829 },
      components: {
        city: "São Luís",
        state: "Maranhão",
        country: "Brasil",
        country_code: "br",
      },
    },
  ],
  paris: [
    {
      formatted: "Paris, França",
      geometry: { lat: 48.8566, lng: 2.3522 },
      components: {
        city: "Paris",
        country: "França",
        country_code: "fr",
      },
    },
  ],
  new: [
    {
      formatted: "Nova York, EUA",
      geometry: { lat: 40.7128, lng: -74.006 },
      components: {
        city: "Nova York",
        state: "Nova York",
        country: "Estados Unidos",
        country_code: "us",
      },
    },
    {
      formatted: "Nova Orleans, EUA",
      geometry: { lat: 29.9511, lng: -90.0715 },
      components: {
        city: "Nova Orleans",
        state: "Luisiana",
        country: "Estados Unidos",
        country_code: "us",
      },
    },
  ],
  tokyo: [
    {
      formatted: "Tóquio, Japão",
      geometry: { lat: 35.6762, lng: 139.6503 },
      components: {
        city: "Tóquio",
        country: "Japão",
        country_code: "jp",
      },
    },
  ],
  lisbon: [
    {
      formatted: "Lisboa, Portugal",
      geometry: { lat: 38.7223, lng: -9.1393 },
      components: {
        city: "Lisboa",
        country: "Portugal",
        country_code: "pt",
      },
    },
  ],
};

/**
 * Cliente para a API OpenCage
 */
class OpenCageClient {
  private apiKey: string;
  private baseUrl: string;
  private cache: Map<string, { results: OpenCageResult[]; timestamp: number }>;
  private cacheExpiration: number;

  constructor() {
    // Usar diretamente a API key que funcionava anteriormente
    this.apiKey = OPENCAGE_API_KEY;
    this.baseUrl = OPENCAGE_API_URL;
    this.cache = new Map();
    this.cacheExpiration = 4 * 60 * 60 * 1000; // 4 horas em ms
  }

  /**
   * Verifica se o serviço está configurado corretamente
   */
  isConfigured(): boolean {
    return true; // Sempre configurado com a chave fixa
  }

  /**
   * Verifica se está usando a API key de fallback
   */
  isUsingFallbackKey(): boolean {
    return false; // Não estamos usando fallback, estamos usando a chave fixa
  }

  /**
   * Limpa o cache completamente
   */
  clearCache(): void {
    this.cache.clear();
    console.log("[OpenCage] Cache limpo com sucesso");
  }

  /**
   * Busca localizações pelo termo de pesquisa usando a implementação anterior que funcionava
   */
  async searchLocation(query: string): Promise<OpenCageResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    // Verificar cache primeiro
    const normalizedQuery = query.trim().toLowerCase();
    const cached = this.cache.get(normalizedQuery);

    if (cached && Date.now() - cached.timestamp < this.cacheExpiration) {
      console.log(`[OpenCage] Usando resultados em cache para "${query}"`);
      return cached.results;
    }

    try {
      const response = await axios.get<OpenCageResponse>(this.baseUrl, {
        params: {
          q: query,
          key: this.apiKey,
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

        // Armazenar no cache
        this.cache.set(normalizedQuery, {
          results: sortedResults,
          timestamp: Date.now(),
        });

        return sortedResults;
      }

      return [];
    } catch (error) {
      console.error("[OpenCage] Erro ao buscar localização:", error);
      return [];
    }
  }

  /**
   * Obtém informações detalhadas de um local por coordenadas
   */
  async getLocationDetails(
    lat: number,
    lng: number
  ): Promise<OpenCageResult | null> {
    const query = `${lat},${lng}`;

    try {
      const response = await axios.get<OpenCageResponse>(this.baseUrl, {
        params: {
          q: query,
          key: this.apiKey,
          language: "pt-BR",
          no_annotations: 0,
        },
      });

      if (response.data.results.length > 0) {
        return response.data.results[0];
      }

      return null;
    } catch (error) {
      console.error("[OpenCage] Erro ao obter detalhes da localização:", error);
      return null;
    }
  }

  /**
   * Formata um resultado para exibição simplificada usando a lógica anterior que funcionava
   */
  formatLocationResult(result: OpenCageResult): string {
    if (!result) return "";

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

  /**
   * Obtém o emoji da bandeira do país
   */
  getCountryFlag(result: OpenCageResult): string {
    if (result?.annotations?.flag) {
      return result.annotations.flag;
    }

    // Fallback: criar emoji de bandeira do código do país
    if (result?.components?.country_code) {
      const countryCode = result.components.country_code.toUpperCase();
      // Converter código de país para emoji de bandeira (Unicode)
      return countryCode
        .split("")
        .map((letter) => String.fromCodePoint(letter.charCodeAt(0) + 127397))
        .join("");
    }

    return "";
  }

  /**
   * Obtém o fuso horário do local, se disponível
   */
  getTimezone(result: OpenCageResult): string | null {
    return result?.annotations?.timezone?.name || null;
  }
}

// Exportar uma instância única
export const opencage = new OpenCageClient();
