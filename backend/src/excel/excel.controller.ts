import {
  BadRequestException,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ServerResponse } from 'http';
import { ExportEmployeesQueryDto } from './dto/export-employees-query.dto';
import { MAX_IMPORT_BYTES, XLSX_MIME_TYPE } from './excel-columns';
import { ExcelService, ImportResult } from './excel.service';

@Controller('excel')
export class ExcelController {
  constructor(private readonly service: ExcelService) {}

  @Get('template')
  @Header('Content-Type', XLSX_MIME_TYPE)
  @Header('Content-Disposition', 'attachment; filename="employee-import-template.xlsx"')
  async template(): Promise<StreamableFile> {
    return new StreamableFile(await this.service.buildTemplate());
  }

  @Get('export')
  async export(@Query() query: ExportEmployeesQueryDto, @Res() response: ServerResponse): Promise<void> {
    const date = new Date().toISOString().slice(0, 10);
    response.setHeader('Content-Type', XLSX_MIME_TYPE);
    response.setHeader('Content-Disposition', `attachment; filename="employees-${date}.xlsx"`);
    await this.service.writeExport(query, response);
  }

  /** Oversized files are rejected by multer with 413 before they are read into memory. */
  @Post('import')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_IMPORT_BYTES, files: 1 } }))
  import(@UploadedFile() file?: Express.Multer.File): Promise<ImportResult> {
    if (!file) {
      throw new BadRequestException('Attach an .xlsx file in the "file" field.');
    }
    if (!file.originalname.toLowerCase().endsWith('.xlsx')) {
      throw new BadRequestException('Only .xlsx files can be imported.');
    }
    return this.service.importWorkbook(file.buffer);
  }
}
