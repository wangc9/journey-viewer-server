type StationJourneyCountByMonth = {
  month: Date;
  station_id: string;
  departure_count: number;
  arrival_count: number;
};

type IrregularJourneyPercentage = {
  station_id: string;
  station_name: string;
  percentage: string;
};
