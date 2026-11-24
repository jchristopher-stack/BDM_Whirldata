import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'customFilter'
})
export class CustomFilterPipe implements PipeTransform {

  /**
   * Transforms custom filter pipe
   * Method used to filter the json array with for particular key and search value.
   * @param array 
   * @param searchTerm 
   * @param filterKeyName 
   * @returns filtered json array 
   */
  transform(array: any, searchTerm: any,filterKeyName:any): any {
    var arr = array.filter((res: any) => {
      if(filterKeyName ? res[filterKeyName].toLowerCase().includes(searchTerm.toLowerCase()): res.toLowerCase().includes(searchTerm.toLowerCase())){
        return res;
      }
    })
    return arr;
  }

}
