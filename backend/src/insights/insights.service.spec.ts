import { InsightsRepository } from './insights.repository';
import { InsightsService } from './insights.service';

type RepoMock = jest.Mocked<
  Pick<
    InsightsRepository,
    'countEmployees' | 'headcountByCountry' | 'headcountByDepartment' | 'countrySummaries' | 'jobTitleSummaries'
  >
>;

function setup() {
  const repo: RepoMock = {
    countEmployees: jest.fn(),
    headcountByCountry: jest.fn(),
    headcountByDepartment: jest.fn(),
    countrySummaries: jest.fn(),
    jobTitleSummaries: jest.fn(),
  };
  const service = new InsightsService(repo as unknown as InsightsRepository);
  return { repo, service };
}

describe('InsightsService', () => {
  describe('overview', () => {
    it('reports total headcount with headcount by country and by department', async () => {
      const { repo, service } = setup();
      repo.countEmployees.mockResolvedValue(3);
      repo.headcountByCountry.mockResolvedValue([
        { countryCode: 'IN', currency: 'INR', headcount: 2 },
        { countryCode: 'GB', currency: 'GBP', headcount: 1 },
      ]);
      repo.headcountByDepartment.mockResolvedValue([{ department: 'Engineering', headcount: 3 }]);

      const overview = await service.overview();

      expect(overview).toEqual({
        totalHeadcount: 3,
        byCountry: [
          { countryCode: 'IN', countryName: 'India', currency: 'INR', headcount: 2 },
          { countryCode: 'GB', countryName: 'United Kingdom', currency: 'GBP', headcount: 1 },
        ],
        byDepartment: [{ department: 'Engineering', headcount: 3 }],
      });
    });
  });

  describe('countrySummaries', () => {
    it('converts the numeric text Postgres returns into exact numbers', async () => {
      const { repo, service } = setup();
      repo.countrySummaries.mockResolvedValue([
        {
          countryCode: 'GB',
          currency: 'GBP',
          headcount: 2,
          minSalary: '61000.75',
          maxSalary: '72000.00',
          averageSalary: '66500.38',
          medianSalary: '66500.38',
        },
      ]);

      const [summary] = await service.countrySummaries();

      expect(summary).toEqual({
        countryCode: 'GB',
        countryName: 'United Kingdom',
        currency: 'GBP',
        headcount: 2,
        minSalary: 61000.75,
        maxSalary: 72000,
        averageSalary: 66500.38,
        medianSalary: 66500.38,
      });
    });

    it('returns an empty list when there are no employees', async () => {
      const { repo, service } = setup();
      repo.countrySummaries.mockResolvedValue([]);

      expect(await service.countrySummaries()).toEqual([]);
    });
  });

  describe('jobTitleSummaries', () => {
    it('queries the requested country only', async () => {
      const { repo, service } = setup();
      repo.jobTitleSummaries.mockResolvedValue([]);

      await service.jobTitleSummaries('IN');

      expect(repo.jobTitleSummaries).toHaveBeenCalledWith('IN');
    });

    it('returns per job title figures with the country currency', async () => {
      const { repo, service } = setup();
      repo.jobTitleSummaries.mockResolvedValue([
        {
          jobTitle: 'Software Engineer',
          headcount: 4,
          minSalary: '1000000.00',
          maxSalary: '1400000.00',
          averageSalary: '1200000.50',
        },
      ]);

      const result = await service.jobTitleSummaries('IN');

      expect(result).toEqual({
        countryCode: 'IN',
        countryName: 'India',
        currency: 'INR',
        jobTitles: [
          {
            jobTitle: 'Software Engineer',
            headcount: 4,
            minSalary: 1000000,
            maxSalary: 1400000,
            averageSalary: 1200000.5,
          },
        ],
      });
    });
  });
});
