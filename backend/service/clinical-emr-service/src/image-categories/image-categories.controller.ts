import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ImageCategoriesService } from './image-categories.service';
import { CreateImageCategoryDto } from './dto/create-image-category.dto';
import { UpdateImageCategoryDto } from './dto/update-image-category.dto';

@ApiTags('Dental Images')
@Controller('image-categories')
export class ImageCategoriesController {
  constructor(private readonly imageCategoriesService: ImageCategoriesService) {}

  @Post()
  create(@Body() createImageCategoryDto: CreateImageCategoryDto) {
    return this.imageCategoriesService.create(createImageCategoryDto);
  }

  @Get()
  findAll() {
    return this.imageCategoriesService.findAll();
  }

  @Get(':category_id')
  findOne(@Param('category_id', ParseUUIDPipe) category_id: string) {
    return this.imageCategoriesService.findOne(category_id);
  }

  @Get('name/:category_name')
  findByName(@Param('category_name') category_name: string) {
    return this.imageCategoriesService.findByName(category_name);
  }

  @Patch(':category_id')
  update(
    @Param('category_id', ParseUUIDPipe) category_id: string,
    @Body() updateImageCategoryDto: UpdateImageCategoryDto,
  ) {
    return this.imageCategoriesService.update(category_id, updateImageCategoryDto);
  }

  @Delete(':category_id')
  remove(@Param('category_id', ParseUUIDPipe) category_id: string) {
    return this.imageCategoriesService.remove(category_id);
  }
}
