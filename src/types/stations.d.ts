type StationJourneyCountByMonth = {
  month: Date;
  station_id: string;
  departure_count: number;
  arrival_count: number;
};

type SingleStation = {
  station_name: string;
  station_address: string;
  start_count: string;
  return_count: string;
  start_average: string;
  return_average: string;
  percentage: string;
};

type IrregularJourneyPercentage = {
  station_id: string;
  station_name: string;
  percentage: string;
};
