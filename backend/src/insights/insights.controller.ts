import { Controller, Get, Param } from '@nestjs/common';
import { CountryCodeParamDto } from './dto/country-code-param.dto';
import { InsightsService } from './insights.service';
import { CountryJobTitles, CountrySummary, Overview } from './insights.types';

@Controller('insights')
export class InsightsController {
  constructor(private readonly service: InsightsService) {}

  @Get('overview')
  overview(): Promise<Overview> {
    return this.service.overview();
  }

  @Get('countries')
  countrySummaries(): Promise<CountrySummary[]> {
    return this.service.countrySummaries();
  }

  @Get('countries/:code/job-titles')
  jobTitleSummaries(@Param() { code }: CountryCodeParamDto): Promise<CountryJobTitles> {
    return this.service.jobTitleSummaries(code);
  }
}
