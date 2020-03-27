import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageRecogntionComponent } from './image-recogntion.component';

describe('ImageRecogntionComponent', () => {
  let component: ImageRecogntionComponent;
  let fixture: ComponentFixture<ImageRecogntionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImageRecogntionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageRecogntionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
